/** The distinct values of one field, as filter options, labelled and sorted by label. */
export function facetOptions<T>(
  rows: T[],
  value: (row: T) => string,
  labels: Record<string, string> = {},
): { label: string; value: string }[] {
  return [...new Set(rows.map(value))]
    .map((v) => ({ value: v, label: labels[v] ?? v }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
