import { listedLayouts, pageLayouts, pageGoToLayout, pagePrint } from '../src/page-calls.ts';
import type { Api } from '../src/api.ts';
import type { FindRequest, SortSpec, Value } from '../src/types.ts';

export interface PageHost {
  api: Pick<Api, 'db' | 'records' | 'record' | 'create' | 'update' | 'remove' | 'summarize' | 'menu' | 'valueList'>;
  layout?: string;
  runScript(name: string, parameter: string): Promise<unknown>;
  goToLayout(name: string): Promise<void>;
  print(): Promise<void>;
}

/** Calls use the signed-in account's API, never a design or administrator API. */
export async function pageCall(host: PageHost, method: string, args: unknown[]): Promise<unknown> {
  const text = (v: unknown, what: string): string => {
    if (typeof v !== 'string' || !v) throw new Error(`${what} is missing`);
    return v;
  };
  const fields = (v: unknown): Record<string, Value> => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('Field data must be an object of field names and values');
    return v as Record<string, Value>;
  };
  const range = (o: unknown) => {
    const x = (o && typeof o === 'object' ? o : {}) as { offset?: unknown; limit?: unknown; sort?: unknown };
    return {
      offset: Math.max(1, Math.trunc(Number(x.offset) || 1)),
      limit: Math.min(1000, Math.max(1, Math.trunc(Number(x.limit) || 100))),
      ...(Array.isArray(x.sort) ? { sort: x.sort as SortSpec[] } : {}),
    };
  };
  switch (method) {
    case 'layouts': return pageLayouts(listedLayouts((await host.api.menu()).layouts, host.layout));
    case 'goToLayout': {
      const name = text(args[0], 'The layout');
      return pageGoToLayout(listedLayouts((await host.api.menu()).layouts, host.layout), name, host.goToLayout);
    }
    case 'valueList': return host.api.valueList(host.layout ?? '', text(args[0], 'The value list'));
    case 'print': return pagePrint((await host.api.menu()).printing !== false, host.print);
    case 'context': return { file: host.api.db, layout: host.layout, mode: 'browse' };
    case 'records': return host.api.records(text(args[0], 'The layout'), range(args[1]));
    case 'find': {
      const query = Array.isArray(args[1]) ? args[1] : args[1] && typeof args[1] === 'object' ? [args[1]] : undefined;
      if (!query?.length) throw new Error('A find needs at least one request, such as {"Status": "Open"}');
      return host.api.records(text(args[0], 'The layout'), { ...range(args[2]), query: query as FindRequest[] });
    }
    case 'record': return host.api.record(text(args[0], 'The layout'), text(args[1], 'The record id'));
    case 'create': return { recordId: await host.api.create(text(args[0], 'The layout'), fields(args[1])) };
    case 'update': return { modId: await host.api.update(text(args[0], 'The layout'), text(args[1], 'The record id'), fields(args[2])) };
    case 'remove': await host.api.remove(text(args[0], 'The layout'), text(args[1], 'The record id')); return { deleted: true };
    case 'summarize': {
      if (!args[0] || typeof args[0] !== 'object') throw new Error('summarize takes a widget, such as {"kind": "number", "layout": "Invoices"}');
      return host.api.summarize(args[0] as Record<string, unknown>);
    }
    case 'performScript': await host.runScript(text(args[0], 'The script name'), String(args[1] ?? '')); return null;
  }
  throw new Error(`${method} is not supported in /next/; use /app/.`);
}
