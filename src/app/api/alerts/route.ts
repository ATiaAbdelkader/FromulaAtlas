import { NextRequest, NextResponse } from 'next/server';
import { fetchCurrentWeather, fetchDailyEto } from '@/lib/open-meteo';
import { runAllDiseaseModels, type DailyWeather } from '@/lib/disease-models';
import { getPhenologyAlerts, getCurrentStage } from '@/lib/phenology-alerts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface AlertsInput {
  lat: number;
  lng: number;
  crop: string;
  plantingDate: string;     // ISO date
  fieldAreaHa?: number;
}

interface Alert {
  id: string;
  category: 'disease' | 'phenology' | 'weather';
  priority: 'low' | 'info' | 'warning' | 'action' | 'critical';
  title: string;
  message: string;
  action?: string;
  forecastDays?: number;
  riskScore?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<AlertsInput>;

    if (body.lat == null || body.lng == null || !body.crop || !body.plantingDate) {
      return NextResponse.json(
        { error: 'lat, lng, crop, and plantingDate are required' },
        { status: 400 }
      );
    }

    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const crop = String(body.crop);
    const plantingDate = new Date(body.plantingDate);

    // Calculate current week of season
    const now = new Date();
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const currentWeek = Math.max(1, Math.floor((now.getTime() - plantingDate.getTime()) / msPerWeek) + 1);

    // Determine crop season length (from crop-presets if available, else default 28)
    const cropLower = crop.toLowerCase();
    const seasonLengths: Record<string, number> = {
      tomato: 30, strawberry: 36, avocado: 52, blueberry: 40, lettuce: 12,
      pepper: 30, cucumber: 24, citrus: 52, coffee: 52, maize: 22,
    };
    const totalWeeks = seasonLengths[cropLower] || 28;
    const currentStage = getCurrentStage(cropLower, currentWeek, totalWeeks);

    // Fetch weather forecast (7 days) — use hourly for humidity, daily for temp/rain
    // If weather API fails (rate limit, network), still return phenology alerts.
    let days: DailyWeather[] = [];
    let weatherAvailable = false;
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,shortwave_radiation_sum` +
        `&hourly=relative_humidity_2m` +
        `&forecast_days=7&timezone=auto`;

      const weatherRes = await fetch(weatherUrl, { signal: AbortSignal.timeout(10000) });
      if (weatherRes.ok) {
        const weatherData = await weatherRes.json();
        if (!weatherData.error) {
          const daily = weatherData.daily;
          const hourly = weatherData.hourly;
          weatherAvailable = true;

          // Aggregate hourly humidity → daily min/max/mean
          const dailyHumidity: { min: number; max: number; mean: number }[] = [];
          if (hourly?.relative_humidity_2m && hourly?.time) {
            for (let d = 0; d < (daily.time?.length || 0); d++) {
              const dayDate = daily.time[d].slice(0, 10);
              const dayHours = hourly.time
                .map((t: string, i: number) => ({ t, rh: hourly.relative_humidity_2m[i] }))
                .filter((h: { t: string; rh: number }) => h.t.slice(0, 10) === dayDate && h.rh != null);
              if (dayHours.length > 0) {
                const values = dayHours.map((h: { rh: number }) => h.rh);
                dailyHumidity.push({
                  min: Math.min(...values),
                  max: Math.max(...values),
                  mean: values.reduce((a: number, b: number) => a + b, 0) / values.length,
                });
              } else {
                dailyHumidity.push({ min: 50, max: 80, mean: 65 });
              }
            }
          }

          // Build DailyWeather array
          for (let i = 0; i < (daily.time?.length || 0); i++) {
            const tMin = daily.temperature_2m_min?.[i] ?? 15;
            const tMax = daily.temperature_2m_max?.[i] ?? 25;
            const rh = dailyHumidity[i] || { min: 50, max: 80, mean: 65 };
            const rain = daily.precipitation_sum?.[i] ?? 0;
            const leafWetnessHours = Math.min(24, (rh.max >= 90 ? 10 : rh.max >= 80 ? 6 : 3) + (rain > 1 ? 4 : 0));
            days.push({
              date: daily.time[i], tMin, tMax, tMean: (tMin + tMax) / 2,
              rhMin: rh.min, rhMax: rh.max, rhMean: rh.mean,
              rain, leafWetnessHours, solarRadiation: daily.shortwave_radiation_sum?.[i] ?? 300,
            });
          }
        }
      }
    } catch {
      // Weather fetch failed — continue with phenology-only alerts
    }

    // Run disease models (only if weather data is available)
    const diseaseAlerts: Alert[] = weatherAvailable && days.length > 0
      ? runAllDiseaseModels(days, crop, currentStage)
          .filter(r => r.riskLevel !== 'low')
          .map(r => ({
            id: `disease-${r.disease.replace(/\s+/g, '-').toLowerCase()}`,
            category: 'disease' as const,
            priority: r.riskLevel === 'critical' ? 'critical' as const : r.riskLevel === 'high' ? 'action' as const : 'warning' as const,
            title: r.disease,
            message: r.explanation,
            action: r.recommendation,
            forecastDays: r.forecastDays,
            riskScore: r.riskScore,
          }))
      : [];

    // Run phenology alerts
    const phenoAlerts = getPhenologyAlerts(crop, body.plantingDate, currentWeek, totalWeeks);
    const phenologyAlerts: Alert[] = phenoAlerts.map(a => ({
      id: `phenology-${a.type}-${currentWeek}`,
      category: 'phenology',
      priority: a.priority,
      title: a.title,
      message: a.message,
      action: a.action,
    }));

    // Weather alerts (frost, heat, heavy rain) — only if weather available
    const weatherAlerts: Alert[] = [];
    if (weatherAvailable) {
      for (const d of days) {
        if (d.tMin < 2) {
          weatherAlerts.push({
            id: `frost-${d.date}`,
            category: 'weather',
            priority: 'critical',
            title: `Frost risk on ${d.date}`,
            message: `Minimum temperature forecast: ${d.tMin.toFixed(1)}°C. Frost can damage ${crop}.`,
            action: 'Protect crops with frost cloth, overhead irrigation, or move container plants indoors.',
            forecastDays: days.indexOf(d),
          });
        }
        if (d.tMax > 38) {
          weatherAlerts.push({
            id: `heat-${d.date}`,
            category: 'weather',
            priority: 'action',
            title: `Extreme heat on ${d.date}`,
            message: `Maximum temperature forecast: ${d.tMax.toFixed(1)}°C. Heat stress likely.`,
            action: 'Increase irrigation, use shade cloth (30-50%), avoid foliar sprays during peak heat.',
            forecastDays: days.indexOf(d),
          });
        }
        if (d.rain > 40) {
          weatherAlerts.push({
            id: `heavy-rain-${d.date}`,
            category: 'weather',
            priority: 'warning',
            title: `Heavy rain on ${d.date}`,
            message: `Precipitation forecast: ${d.rain.toFixed(0)} mm. Risk of leaching, soil erosion, and disease spread.`,
            action: 'Delay fertilizer application. Ensure drainage is clear. Scout for disease 3-5 days after.',
            forecastDays: days.indexOf(d),
          });
        }
      }
    }

    // Combine and sort by priority
    const allAlerts = [...diseaseAlerts, ...phenologyAlerts, ...weatherAlerts].sort((a, b) => {
      const priorityOrder = { critical: 0, action: 1, warning: 2, info: 3, low: 4 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return NextResponse.json({
      crop,
      currentWeek,
      totalWeeks,
      currentStage,
      location: { lat, lng },
      weatherAvailable,
      forecastDays: days.length,
      alerts: allAlerts,
      summary: {
        total: allAlerts.length,
        critical: allAlerts.filter(a => a.priority === 'critical').length,
        action: allAlerts.filter(a => a.priority === 'action').length,
        warning: allAlerts.filter(a => a.priority === 'warning').length,
        info: allAlerts.filter(a => a.priority === 'info').length,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Alerts error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Formula Atlas Predictive Alerts Engine',
    description: 'Combines 7-day weather forecast + crop phenology + 5 disease models to generate proactive alerts.',
    endpoint: 'POST /api/alerts',
    body: { lat: 'number', lng: 'number', crop: 'string', plantingDate: 'ISO date', fieldAreaHa: 'number (optional)' },
    diseaseModels: ['Late Blight (Smith Period)', 'Early Blight (FAST)', 'Powdery Mildew', 'Botrytis', 'Blossom-End Rot'],
    weatherAlerts: ['Frost', 'Extreme Heat', 'Heavy Rain'],
    phenologyAlerts: ['Stage Transition', 'Fertigation Switch', 'Sampling Window', 'Irrigation Check', 'Nutrient Focus'],
  });
}

// Suppress unused import warnings (used internally)
void fetchCurrentWeather;
void fetchDailyEto;
