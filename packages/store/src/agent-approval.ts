// Helpers for approval-gated agent writes (Store.gateAgentWrite). Kept out of store.ts so that file stays under the release size limit.
import type { FieldData, LayoutInfo } from './store.ts';

/** Splits a write into the fields of the layout's own table and the related-table fields ("TO::Field"). */
export function splitWriteFields(info: LayoutInfo, data: FieldData): { own: FieldData; related: Map<string, FieldData> } {
  // Related fields ("TO::Field") target the first related record; vendor parity is unverified.
  const own: FieldData = {};
  const related = new Map<string, FieldData>();
  for (const [k, v] of Object.entries(data)) {
    const m = /^(.+?)::(.+)$/.exec(k);
    if (m && info.home && m[1] !== info.occurrence) {
      if (!related.has(m[1])) related.set(m[1], {});
      related.get(m[1])![m[2]] = v;
    } else own[k] = m ? m[2] : v;
  }
  return { own, related };
}
