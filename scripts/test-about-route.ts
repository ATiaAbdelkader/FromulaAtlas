import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const route = readFileSync(resolve(root, 'src/app/about/page.tsx'), 'utf8');
const shell = readFileSync(resolve(root, 'src/app/app/page.tsx'), 'utf8');
const about = readFileSync(resolve(root, 'src/components/agri/about-page.tsx'), 'utf8');

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`About route regression failed: ${message}`);
  }
}

assert(route.includes("import { AboutPage } from '@/components/agri/about-page';"), 'public route should reuse the existing AboutPage component');
assert(route.includes('export default function AboutRoute()'), 'public About route should expose a default page component');
assert(route.includes('href="/app"'), 'public About route should provide a path back to the app');
assert(route.includes('dir={isRTL ? \'rtl\' : \'ltr\'}'), 'public About route should preserve Arabic RTL direction');
assert(shell.includes("{activeTab === 'about' && (") && shell.includes('<AboutPage />'), 'app-shell About tab should remain available');
assert(about.includes('useTranslation'), 'reused About content should continue to use the shared language store');

console.log('About route regression passed.');
