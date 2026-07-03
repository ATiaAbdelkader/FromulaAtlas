// Learning & discovery: formula of the day, tips, achievement badges.
import { allFormulas } from './formulas-data';
import { calculators } from '@/components/agri/calculators';

const calcSet: Record<string, boolean> = {};
Object.keys(calculators).forEach(k => { calcSet[k] = true; });

export function getFormulaOfTheDay() {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const calcFormulas = allFormulas.filter(f => f.code in calcSet);
  return calcFormulas[dayOfYear % calcFormulas.length];
}

export interface Badge { id: string; name: string; description: string; icon: string; color: string; threshold: number; metric: string; }

export const badges: Badge[] = [
  { id: 'explorer', name: 'Explorer', description: 'View 10 formulas', icon: 'Compass', color: 'text-blue-600', threshold: 10, metric: 'formulasViewed' },
  { id: 'scholar', name: 'Scholar', description: 'View 50 formulas', icon: 'GraduationCap', color: 'text-violet-600', threshold: 50, metric: 'formulasViewed' },
  { id: 'calculator', name: 'Calculator', description: 'Run 10 calculations', icon: 'Calculator', color: 'text-emerald-600', threshold: 10, metric: 'calculationsRun' },
  { id: 'power-user', name: 'Power User', description: 'Run 50 calculations', icon: 'Zap', color: 'text-amber-600', threshold: 50, metric: 'calculationsRun' },
  { id: 'farmer', name: 'Farmer', description: 'Create 1 farm', icon: 'Sprout', color: 'text-green-600', threshold: 1, metric: 'farmsCreated' },
  { id: 'collector', name: 'Collector', description: 'Favorite 5 formulas', icon: 'Star', color: 'text-yellow-600', threshold: 5, metric: 'favoritesAdded' },
  { id: 'librarian', name: 'Librarian', description: 'Favorite 20 formulas', icon: 'Bookmark', color: 'text-rose-600', threshold: 20, metric: 'favoritesAdded' },
  { id: 'note-taker', name: 'Note Taker', description: 'Write 3 notes', icon: 'StickyNote', color: 'text-stone-600', threshold: 3, metric: 'notesWritten' },
];

export interface Tip { id: string; text: string; category: string; }
export const tips: Tip[] = [
  { id: '1', text: 'Press / to instantly focus the search bar.', category: 'efficiency' },
  { id: '2', text: 'Set your location for live weather and ET₀ data.', category: 'discovery' },
  { id: '3', text: 'Create a farm to tag calculations and track seasonal performance.', category: 'discovery' },
  { id: '4', text: 'Pick a crop package to auto-fill 7 calculators with research-backed defaults.', category: 'discovery' },
  { id: '5', text: 'Use the Share button in any calculator to copy a link with your exact inputs.', category: 'pro-tip' },
  { id: '6', text: 'Export farm calculations as CSV for seasonal analysis in Excel.', category: 'pro-tip' },
  { id: '7', text: 'Print formula cards as PDF field reference guides.', category: 'field' },
  { id: '8', text: 'Toggle Arabic (ع) for full RTL bilingual support.', category: 'discovery' },
  { id: '9', text: 'Use dark mode for evening reading or bright field conditions.', category: 'efficiency' },
  { id: '10', text: 'Decision Trees guide you from a symptom to a recommended action.', category: 'field' },
  { id: '11', text: 'Run a Guided Workflow to chain multiple calculators with carry-forward.', category: 'pro-tip' },
  { id: '12', text: 'The weather widget auto-refreshes every 30 minutes.', category: 'field' },
];

export function getTipOfTheDay(): Tip {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return tips[dayOfYear % tips.length];
}
