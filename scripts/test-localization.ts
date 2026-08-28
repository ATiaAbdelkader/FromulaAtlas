import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { localizedCropLabels, localizedCropName } from '../src/lib/crop-localization';
import { formatWeatherDate, localizedWeatherLabel, localizedWeatherLabels } from '../src/lib/weather-localization';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const weatherLabels = localizedWeatherLabels();
for (const [code, labels] of Object.entries(weatherLabels)) {
  assert(labels.en.length > 0 && labels.fr.length > 0 && labels.ar.length > 0, `Weather code ${code} must have English, French, and Arabic labels`);
}
assert(localizedWeatherLabel(0, 'en') === 'Clear sky', 'English weather label must remain stable');
assert(localizedWeatherLabel(0, 'fr') === 'Ciel dégagé', 'French weather label must be localized');
assert(localizedWeatherLabel(0, 'ar') === 'سماء صافية', 'Arabic weather label must be localized');
assert(formatWeatherDate('2026-08-16', 'fr').length > 0, 'French weather dates must be formatted through a locale-aware helper');
assert(formatWeatherDate('2026-08-16', 'ar').length > 0, 'Arabic weather dates must be formatted through a locale-aware helper');

const cropLabels = localizedCropLabels();
assert(Object.keys(cropLabels).length >= 20, 'Lifecycle crops must have localized labels');
assert(localizedCropName('en', 'tomato', 'Tomato') === 'Tomato (Fresh Market)', 'English crop label must preserve the lifecycle name');
assert(localizedCropName('fr', 'tomato', 'Tomato') === 'Tomate (marché du frais)', 'French crop label must be localized');
assert(localizedCropName('ar', 'tomato', 'Tomato') === 'الطماطم (السوق الطازجة)', 'Arabic crop label must be localized');

const weatherWidget = readFileSync(resolve(process.cwd(), 'src/components/agri/weather-widget.tsx'), 'utf8');
assert(weatherWidget.includes('localizedWeatherLabel'), 'Weather Widget must localize dynamic weather conditions');
assert(weatherWidget.includes('className="ps-9 pe-9"'), 'Weather Widget search input must use RTL-safe logical padding');
assert(weatherWidget.includes('className="absolute start-3'), 'Weather Widget search icon must use RTL-safe logical positioning');

const weatherAlerts = readFileSync(resolve(process.cwd(), 'src/components/agri/weather-alert-banner.tsx'), 'utf8');
assert(weatherAlerts.includes('copyFor'), 'Weather alerts must use the shared trilingual copy helper');
assert(weatherAlerts.includes('Alerte au gel'), 'Weather alerts must provide explicit French alert copy');
assert(weatherAlerts.includes('formatWeatherDate'), 'Weather alerts must format dates using the active language');
assert(!weatherAlerts.includes('computeAlerts(forecast, isRTL)'), 'Weather alerts must not collapse French into the English branch');

const calendar = readFileSync(resolve(process.cwd(), 'src/components/agri/algeria-crop-calendar.tsx'), 'utf8');
assert(calendar.includes('source entries') && calendar.includes('entrées source') && calendar.includes('إدخالاً من المصدر'), 'Calendar entry counts must remain trilingual');
assert(calendar.includes("Source-traceable', 'موثق بالمصدر', 'Traçable par source'"), 'Calendar source badge must remain trilingual');
assert(calendar.includes("matching source entries across the year', 'إدخالات مصدر مطابقة على مدار السنة', 'entrées source correspondantes sur l’année'"), 'Calendar annual matching-entry label must remain trilingual');
assert(calendar.includes('const moveMonth = (offset: number)'), 'Calendar must expose compact previous/next month navigation');
assert(calendar.includes('Previous month') && calendar.includes('Next month'), 'Calendar mobile navigation must be accessible and trilingual');
assert(calendar.includes('className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 p-2 sm:hidden"'), 'Calendar mobile month navigator must be visible only on small screens');
assert(calendar.includes('grid-cols-4 gap-1.5 sm:grid-cols-4'), 'Calendar month grid must use a compact mobile density');
assert(calendar.includes('className="h-9 ps-9 text-xs"'), 'Calendar crop search input must use RTL-safe logical padding');
assert(calendar.includes('absolute start-3 top-1/2'), 'Calendar crop search icon must use RTL-safe logical positioning');
assert(calendar.includes("'12 PDF sources', '12 مصدر PDF', '12 sources PDF'"), 'Calendar source-count badge must remain trilingual');

const wizard = readFileSync(resolve(process.cwd(), 'src/components/agri/farm-profile-wizard.tsx'), 'utf8');
assert(wizard.includes('localizedCropName(language, c.id, c.name)'), 'Farm Profile Wizard crop choices must use localized crop labels');

const dashboard = readFileSync(resolve(process.cwd(), 'src/components/agri/home-dashboard.tsx'), 'utf8');
assert(dashboard.includes('localizedCropName(language, profile.crop'), 'Dashboard profile summary must localize the selected crop');
assert(dashboard.includes('localizedWeatherLabel(today.weatherCode, language)'), 'Dashboard weather summary must localize dynamic conditions');
assert(dashboard.includes('formatWeatherDate(d.date, language'), 'Dashboard forecast weekdays must use the active language');

const todayTasks = readFileSync(resolve(process.cwd(), 'src/components/agri/today-tasks.tsx'), 'utf8');
assert(todayTasks.includes('localizedCropName(language, crop.id, crop.name)'), 'Today’s Tasks labor metadata must localize crop names');

console.log('Localization regression tests passed.');
