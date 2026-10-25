// Which audit entries belong to a record that is there now.
//
// The audit log is keyed by table and record id. Older stores could reuse an id after a deletion, so one id can name
// several records over time. A record's present life starts
// at its latest creation. A create that puts a deleted record back (a revert of a delete, the data cleanup's undo, the
// console's restore) is logged with revert_of naming the delete entry it undoes: it carries on the life that delete
// ended, so that life's entries are the record's too, and what was logged between that delete and the put-back is
// another record's.

/** A create entry of one record: its seq, and revert_of when it put a deleted record back (0 when it names no entry). */
export interface LifeEntry { seq: number; revert_of: number | null | undefined }

/** Seqs from `from` to `to` (both included) belong to the record. Latest range first; the last one's `from` is 0 for a record that came with the file. */
export interface LifeRange { from: number; to: number }

/** The ranges of audit entries that belong to the record's present life, from its create entries (any order). */
export function lifeRanges(creates: LifeEntry[]): LifeRange[] {
  const rows = [...creates].sort((a, b) => b.seq - a.seq);
  const ranges: LifeRange[] = [];
  let to = Infinity;
  let before = Infinity;
  for (;;) {
    const c = rows.find((r) => r.seq < before);
    if (!c) {
      ranges.push({ from: 0, to });
      return ranges;
    }
    const undoes = c.revert_of === null || c.revert_of === undefined ? undefined : Number(c.revert_of);
    if (undoes === undefined) {
      ranges.push({ from: c.seq, to });
      return ranges;
    }
    if (undoes > 0 && undoes < c.seq) {
      ranges.push({ from: c.seq, to });
      to = undoes;
      before = undoes;
    } else {
      before = c.seq; // names no delete: carries on from the create before it
    }
  }
}

/** Whether an audit entry of the record is within its present life. */
export function inLife(ranges: LifeRange[], seq: number): boolean {
  return ranges.some((r) => seq >= r.from && seq <= r.to);
}

/** Whether the record was made here (its present life starts at a create the log holds), rather than coming with the file. */
export function madeHere(ranges: LifeRange[]): boolean {
  return ranges[ranges.length - 1].from > 0;
}
