import type { MenuItem } from './types.ts';

/** The classic Layouts menu: hide a folder's contents, but retain the current hidden layout. */
export function listedLayouts(items: MenuItem[], current?: string): MenuItem[] {
  const out: MenuItem[] = [];
  let skipBelow = -1;
  for (const m of items) {
    if (skipBelow >= 0 && m.depth > skipBelow) continue;
    skipBelow = -1;
    if (m.hidden && m.kind === 'folder') skipBelow = m.depth;
    else if (!m.hidden || m.name === current) out.push(m);
  }
  return out;
}

export function pageLayouts(items: MenuItem[]): string[] {
  return items.filter((m) => m.kind === 'item' && m.open).map((m) => m.name);
}

export async function pageGoToLayout(items: MenuItem[], name: string, go: (name: string) => Promise<void>): Promise<null> {
  if (!pageLayouts(items).includes(name)) throw new Error(`There is no layout "${name}" to go to`);
  await go(name);
  return null;
}

export async function pagePrint(allowed: boolean, print: () => Promise<void>): Promise<null> {
  if (!allowed) throw new Error('This account isn\'t allowed to print.');
  await print();
  return null;
}

/** Print the window as shown, after the page has had time to paint, as in the classic client. */
export async function printPage(): Promise<void> {
  await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 100)));
  window.print();
}
