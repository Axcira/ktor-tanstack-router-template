import { generateKeyBetween } from "fractional-indexing";

/** Key that sorts before every current row, so a new row stays at the top. */
export function sortKeyBeforeFirst(firstSortKey: string | null): string {
  return generateKeyBetween(null, firstSortKey);
}

/**
 * Fractional key for the item that moved from `from` to `to`.
 * Indexes match a list reorder: the other rows keep their relative order.
 */
export function sortKeyAfterReorder(
  sortKeys: readonly string[],
  from: number,
  to: number,
): string {
  const remaining = sortKeys.filter((_, index) => index !== from);
  const prev = to > 0 ? (remaining[to - 1] ?? null) : null;
  const next = to < remaining.length ? (remaining[to] ?? null) : null;
  return generateKeyBetween(prev, next);
}

export function movedSortKey<T extends { id: number; sortKey: string }>(
  items: readonly T[],
  activeId: number,
  overId: number,
): { id: number; sortKey: string } | null {
  const from = items.findIndex((item) => item.id === activeId);
  const to = items.findIndex((item) => item.id === overId);
  if (from < 0 || to < 0 || from === to) return null;
  return {
    id: activeId,
    sortKey: sortKeyAfterReorder(
      items.map((item) => item.sortKey),
      from,
      to,
    ),
  };
}
