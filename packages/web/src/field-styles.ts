import type { DataRecord, StyleRun } from './types.ts';
import { ownGet } from './own-keys.ts';

// Data formatting comes from stored/API styles; its .fmp12 binary encoding remains unverified.
/** The exact value key, including its repetition, selects runs from the record or portal row. */
export function fieldStyles(record: DataRecord | undefined, key: string, mode: string, row?: { portal: string; recordId?: string }): StyleRun[] | undefined {
  if (mode !== 'browse') return undefined;
  const source = row
    ? row.recordId ? ownGet(ownGet(record?.portalStyles, row.portal), row.recordId) : undefined
    : record?.styles;
  return ownGet(source, key);
}
