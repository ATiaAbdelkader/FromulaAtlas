/**
 * IoT Soil Sensor Dashboard — adapted from AgroAI's AgroSensor module
 * (https://github.com/Aniket-Asawale/AgroAI---AI-and-Automation-in-Agriculture)
 *
 * AgroAI uses Modbus-based real-time soil sensors that read:
 *   - Nitrogen (mg/kg)
 *   - Phosphorus (mg/kg)
 *   - Potassium (mg/kg)
 *   - Temperature (°C)
 *   - Moisture (%)
 *   - EC (μS/cm)
 *   - pH
 *
 * In Algeria, most farmers don't have IoT sensors yet. This module provides:
 *   1. A TypeScript interface for sensor readings (so a future Modbus
 *      integration can use the same types)
 *   2. A simulated sensor reader that generates realistic values based
 *      on soil type (from our SOIL_PROFILES) — for demo/onboarding
 *   3. A localStorage-backed sensor store (for offline-first)
 *   4. Alert thresholds (when N/P/K/pH/EC are out of range)
 *
 * When real sensors are available, the only change needed is to replace
 * the `simulateSensorReading()` function with a `fetchSensorReading()` that
 * calls the Modbus gateway.
 */

import { SOIL_PROFILES, getSoilProfile, type SoilProfile } from './soil-profiles';

// ============================================================================
// Types
// ============================================================================

export interface SensorReading {
  /** Timestamp (ISO string). */
  timestamp: string;
  /** Sensor ID (for multi-sensor setups). */
  sensorId: string;
  /** Nitrogen (mg/kg). */
  nitrogen: number;
  /** Phosphorus (mg/kg). */
  phosphorus: number;
  /** Potassium (mg/kg). */
  potassium: number;
  /** Soil temperature (°C). */
  temperature: number;
  /** Soil moisture (%). */
  moisture: number;
  /** Electrical conductivity (μS/cm). */
  ec: number;
  /** Soil pH. */
  ph: number;
  /** Soil type ID (from SOIL_PROFILES). */
  soilTypeId?: string;
}

export interface SensorAlert {
  parameter: string;
  value: number;
  threshold: [number, number];
  severity: 'low' | 'high' | 'critical';
  message: string;
  messageAr: string;
}

// ============================================================================
// Alert thresholds
// ============================================================================

export const SENSOR_THRESHOLDS = {
  nitrogen: { min: 80, max: 250, unit: 'mg/kg' },
  phosphorus: { min: 30, max: 100, unit: 'mg/kg' },
  potassium: { min: 80, max: 250, unit: 'mg/kg' },
  temperature: { min: 5, max: 40, unit: '°C' },
  moisture: { min: 15, max: 85, unit: '%' },
  ec: { min: 200, max: 2500, unit: 'μS/cm' },
  ph: { min: 5.5, max: 8.5, unit: '' },
};

// ============================================================================
// Simulated sensor reader
// ============================================================================

/**
 * Generate a realistic sensor reading based on soil type.
 * Values are centered on the soil profile's baselines with ±15% random variation.
 *
 * When real sensors are available, replace this with:
 *   async function fetchSensorReading(sensorId: string): Promise<SensorReading> {
 *     const res = await fetch(`/api/sensor/${sensorId}`);
 *     return res.json();
 *   }
 */
export function simulateSensorReading(soilTypeId: string, sensorId = 'sensor-1'): SensorReading {
  const soil = getSoilProfile(soilTypeId);
  if (!soil) {
    // Default values if soil type unknown
    return {
      timestamp: new Date().toISOString(),
      sensorId,
      nitrogen: 100 + Math.random() * 50,
      phosphorus: 50 + Math.random() * 30,
      potassium: 120 + Math.random() * 50,
      temperature: 20 + Math.random() * 8,
      moisture: 30 + Math.random() * 30,
      ec: 800 + Math.random() * 400,
      ph: 6.5 + Math.random() * 1,
      soilTypeId,
    };
  }

  const vary = (base: number, pct: number) => base * (1 + (Math.random() - 0.5) * 2 * pct);

  return {
    timestamp: new Date().toISOString(),
    sensorId,
    nitrogen: vary(soil.nBase, 0.15),
    phosphorus: vary(soil.pBase, 0.15),
    potassium: vary(soil.kBase, 0.15),
    temperature: 18 + Math.random() * 12, // ambient temperature
    moisture: vary(soil.waterRetention * 60, 0.20), // moisture correlates with retention
    ec: vary(soil.ecBase, 0.20),
    ph: vary(soil.phBase, 0.05),
    soilTypeId,
  };
}

/**
 * Check a sensor reading against thresholds and generate alerts.
 */
export function checkSensorAlerts(reading: SensorReading): SensorAlert[] {
  const alerts: SensorAlert[] = [];

  const checks: { param: keyof typeof SENSOR_THRESHOLDS; value: number; label: string; labelAr: string }[] = [
    { param: 'nitrogen', value: reading.nitrogen, label: 'Nitrogen', labelAr: 'النيتروجين' },
    { param: 'phosphorus', value: reading.phosphorus, label: 'Phosphorus', labelAr: 'الفوسفور' },
    { param: 'potassium', value: reading.potassium, label: 'Potassium', labelAr: 'البوتاسيوم' },
    { param: 'temperature', value: reading.temperature, label: 'Temperature', labelAr: 'الحرارة' },
    { param: 'moisture', value: reading.moisture, label: 'Moisture', labelAr: 'الرطوبة' },
    { param: 'ec', value: reading.ec, label: 'EC', labelAr: 'التوصيل الكهربائي' },
    { param: 'ph', value: reading.ph, label: 'pH', labelAr: 'الحامضية' },
  ];

  for (const check of checks) {
    const threshold = SENSOR_THRESHOLDS[check.param];
    if (check.value < threshold.min) {
      const severity = check.value < threshold.min * 0.6 ? 'critical' : 'low';
      alerts.push({
        parameter: check.label,
        value: check.value,
        threshold: [threshold.min, threshold.max],
        severity,
        message: `${check.label} is low (${check.value.toFixed(1)} ${threshold.unit}, min ${threshold.min})`,
        messageAr: `${check.labelAr} منخفض (${check.value.toFixed(1)} ${threshold.unit}، الحد الأدنى ${threshold.min})`,
      });
    } else if (check.value > threshold.max) {
      const severity = check.value > threshold.max * 1.5 ? 'critical' : 'high';
      alerts.push({
        parameter: check.label,
        value: check.value,
        threshold: [threshold.min, threshold.max],
        severity,
        message: `${check.label} is high (${check.value.toFixed(1)} ${threshold.unit}, max ${threshold.max})`,
        messageAr: `${check.labelAr} مرتفع (${check.value.toFixed(1)} ${threshold.unit}، الحد الأقصى ${threshold.max})`,
      });
    }
  }

  return alerts;
}

/**
 * Store sensor readings in localStorage (offline-first).
 */
const SENSOR_HISTORY_KEY = 'sensor_readings_v1';

export function saveSensorReading(reading: SensorReading): void {
  try {
    const raw = localStorage.getItem(SENSOR_HISTORY_KEY);
    const history: SensorReading[] = raw ? JSON.parse(raw) : [];
    history.push(reading);
    // Keep last 100 readings
    if (history.length > 100) history.shift();
    localStorage.setItem(SENSOR_HISTORY_KEY, JSON.stringify(history));
  } catch { /* ignore */ }
}

export function getSensorHistory(limit = 20): SensorReading[] {
  try {
    const raw = localStorage.getItem(SENSOR_HISTORY_KEY);
    const history: SensorReading[] = raw ? JSON.parse(raw) : [];
    return history.slice(-limit).reverse();
  } catch {
    return [];
  }
}
