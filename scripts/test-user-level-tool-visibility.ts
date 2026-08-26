import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  getVisibleToolRegistry,
  isStorageKeyVisibleForLevel,
  isTabVisibleForLevel,
  isToolVisibleForLevel,
  searchTools,
  type ToolEntry,
} from '../src/lib/tool-registry';
import { getUserLevelTabs } from '../src/lib/user-level';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const farmer = getVisibleToolRegistry('farmer');
const manager = getVisibleToolRegistry('manager');
const professional = getVisibleToolRegistry('professional');

assert(isTabVisibleForLevel('home', 'farmer'), 'Farmer must access Home');
assert(isTabVisibleForLevel('calendar', 'farmer'), 'Farmer must access Calendar');
assert(isTabVisibleForLevel('farm', 'farmer'), 'Farmer Farm workspace must remain reachable through the current workspace navigation contract');
assert(isTabVisibleForLevel('farm', 'manager'), 'Farm Manager must access Farm workspace');
assert(isTabVisibleForLevel('insights', 'professional'), 'Professional must access Insights');

assert(!isStorageKeyVisibleForLevel('collapse_rotation', 'farmer'), 'Farmer must not discover hidden rotation section');
assert(!isStorageKeyVisibleForLevel('collapse_report', 'farmer'), 'Farmer must not discover hidden report section');
assert(isStorageKeyVisibleForLevel('collapse_rotation', 'manager'), 'Manager may discover rotation section');
assert(isStorageKeyVisibleForLevel(undefined, 'farmer'), 'Tab-only entries must not be hidden by storage-key policy');

const farmerRotation = farmer.find(tool => tool.id === 'crop-rotation');
const farmerCalendar = farmer.find(tool => tool.id === 'algeria-calendar');
const managerRotation = manager.find(tool => tool.id === 'crop-rotation');
const professionalReport = professional.find(tool => tool.id === 'report');
assert(!farmerRotation, 'Farmer registry must exclude crop rotation');
assert(farmerCalendar, 'Farmer registry must include the source-backed calendar');
assert(managerRotation, 'Manager registry must include crop rotation');
assert(professionalReport, 'Professional registry must include professional reports');
assert(farmerCalendar && isToolVisibleForLevel(farmerCalendar, 'farmer'), 'Calendar entry must pass Farmer visibility policy');

const farmerHelpSource = readFileSync(resolve(process.cwd(), 'src/components/agri/farmer-help.tsx'), 'utf8');
assert(farmerHelpSource.includes("onOpenTool('calendar')"), 'Farmer Help crop-planning action must open the visible Calendar tab');
assert(!farmerHelpSource.includes("onOpenTool('farm', 'collapse_rotation')"), 'Farmer Help must not route crop planning to hidden rotation');

const todayTasksSource = readFileSync(resolve(process.cwd(), 'src/components/agri/today-tasks.tsx'), 'utf8');
assert(todayTasksSource.includes("onOpenTool('farm')"), 'Today\'s Tasks profile setup must open the visible Farmer Farm workspace');
assert(!todayTasksSource.includes("onOpenTool('farm', 'collapse_et_tracker')"), 'Today\'s Tasks profile setup must not open the Evapotranspiration Tracker');

const levelHomeSource = readFileSync(resolve(process.cwd(), 'src/components/agri/level-home.tsx'), 'utf8');
const levelHomeCalendarRoutes = levelHomeSource.match(/onOpenTool\('calendar'\)/g) ?? [];
assert(levelHomeCalendarRoutes.length === 3, 'Farmer, Manager, and Professional planning cards must all open the Calendar tab');
assert(levelHomeSource.includes('Plan one crop'), 'Farmer planning card must remain present');
assert(levelHomeSource.includes('Season and labor'), 'Manager planning card must remain present');
assert(levelHomeSource.includes('Plan crop operations'), 'Professional planning card must remain present');

const farmerFieldSource = readFileSync(resolve(process.cwd(), 'src/components/agri/farmer-field.tsx'), 'utf8');
assert(farmerFieldSource.includes("onOpenTool('calendar')"), 'Farmer Field full-calendar action must open the shared Calendar tab');
assert(!farmerFieldSource.includes("onOpenTool('farm', 'crop_calendar_gen')"), 'Farmer Field must not route full calendar to the legacy Farm crop calendar section');

const homeDashboardSource = readFileSync(resolve(process.cwd(), 'src/components/agri/home-dashboard.tsx'), 'utf8');
assert(homeDashboardSource.includes("let actionTab: TabId = 'calendar';"), 'Shared Today\'s Focus labor-calendar action must use the Calendar tab');
assert(!homeDashboardSource.includes("let actionKey = 'collapse_labor_cal'"), 'Shared Today\'s Focus must not use the legacy labor-calendar section by default');
assert(homeDashboardSource.includes('{profile.setupCompleted && ('), 'Farm Profile summary must appear only after setup is completed so incomplete Manager setup has one entry point');
assert(homeDashboardSource.includes('copyForLevel(language, level'), 'Home Dashboard must select copy by active user level');
assert(homeDashboardSource.includes("{ en: 'farm manager'"), 'Home Dashboard must provide Farm Manager-specific language');
assert(homeDashboardSource.includes("{ en: 'agronomist'"), 'Home Dashboard must provide Professional-specific language');
assert(homeDashboardSource.includes("{ en: 'Operations Shortcuts'"), 'Manager dashboard must use operational quick-action language');
assert(homeDashboardSource.includes("{ en: 'Analysis Actions'"), 'Professional dashboard must use analysis-oriented quick-action language');
assert(homeDashboardSource.includes('<TodayTasks level={level}'), 'Today\'s Tasks must receive the active user level');
assert(todayTasksSource.includes("{ en: 'Today\\'s Work Queue'"), 'Manager Today\'s Tasks must use work-queue language');
assert(todayTasksSource.includes("{ en: 'Today\\'s Field Signals'"), 'Professional Today\'s Tasks must use field-signal language');

const userLevelSource = readFileSync(resolve(process.cwd(), 'src/lib/user-level.ts'), 'utf8');
assert(userLevelSource.includes('export type TabId ='), 'User-level navigation contract must define the canonical TabId union');
assert(!userLevelSource.includes('UserLevelTabId'), 'User-level navigation contract must not retain the duplicate UserLevelTabId alias');

const appShellSource = readFileSync(resolve(process.cwd(), 'src/app/app/page.tsx'), 'utf8');
assert(!appShellSource.includes("type TabId = 'home'"), 'App shell must consume the canonical TabId instead of redefining it');
assert(JSON.stringify(getUserLevelTabs('farmer')) === JSON.stringify(['home', 'myfield', 'farm', 'calendar', 'simulator', 'help', 'about']), 'Farmer mobile navigation must expose every permitted destination');
assert(JSON.stringify(getUserLevelTabs('manager')) === JSON.stringify(['home', 'farm', 'calendar', 'simulator', 'insights', 'tools', 'about']), 'Manager mobile navigation must expose every permitted destination');
assert(JSON.stringify(getUserLevelTabs('professional')) === JSON.stringify(['home', 'formulas', 'tools', 'farm', 'calendar', 'simulator', 'insights', 'about']), 'Professional mobile navigation must expose every permitted destination');
assert(appShellSource.includes('const mobileTabIds = getUserLevelTabs(level);'), 'Mobile navigation must consume the canonical level-aware tab contract');
assert(appShellSource.includes('{tabs.map(tab => ('), 'Mobile navigation must render all permitted tabs rather than slicing a subset');
assert(appShellSource.includes('overflow-x-auto'), 'Mobile navigation must support horizontal access to all role tabs on narrow screens');
assert(appShellSource.includes("'Calendar': 'Calendrier'"), 'Mobile Calendar label must have French localization');
assert(appShellSource.includes("'Search': 'Rechercher'"), 'Mobile Search label must have French localization');

const toolRegistrySource = readFileSync(resolve(process.cwd(), 'src/lib/tool-registry.ts'), 'utf8');
assert(toolRegistrySource.includes("type TabId, type UserLevel } from './user-level'"), 'Tool registry must consume the canonical TabId');
assert(!toolRegistrySource.includes('export type TabId ='), 'Tool registry must not redefine the canonical TabId');

const farmerResults = searchTools('rotation', 20, 'farmer');
const managerResults = searchTools('rotation', 20, 'manager');
assert(!farmerResults.some(result => result.entry.id === 'crop-rotation'), 'Farmer search must exclude hidden rotation');
assert(managerResults.some(result => result.entry.id === 'crop-rotation'), 'Manager search must include rotation');

const uniqueIds = (entries: ToolEntry[]) => new Set(entries.map(entry => entry.id));
assert(uniqueIds(farmer).size === farmer.length, 'Farmer visible registry must not duplicate tool IDs');
assert(uniqueIds(manager).size === manager.length, 'Manager visible registry must not duplicate tool IDs');
assert(uniqueIds(professional).size === professional.length, 'Professional visible registry must not duplicate tool IDs');

console.log(`User-level tool visibility passed: Farmer ${farmer.length}, Manager ${manager.length}, Professional ${professional.length}`);
console.log('Hidden-section filtering, calendar access, search isolation, and registry uniqueness verified.');
