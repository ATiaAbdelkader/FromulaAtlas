const KEY = 'nutriplant_formula_bookmarks_v1';

export function getBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}

export function toggleBookmark(code: string): string[] {
  if (typeof window === 'undefined') return [];
  const current = getBookmarks();
  const next = current.includes(code) ? current.filter(c => c !== code) : [...current, code];
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}
