export type PortfolioDetailRow = {
  label: string;
  value: string;
};

/** Parse FormData JSON for details; drop empty rows. */
export function parsePortfolioDetails(raw: string | null | undefined): PortfolioDetailRow[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return normalizePortfolioDetails(parsed);
  } catch {
    return [];
  }
}

/** Normalize DB / unknown JSON into [{ label, value }]. */
export function normalizePortfolioDetails(value: unknown): PortfolioDetailRow[] {
  if (!Array.isArray(value)) return [];
  const rows: PortfolioDetailRow[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const label = typeof record.label === "string" ? record.label.trim() : "";
    const valueText = typeof record.value === "string" ? record.value.trim() : "";
    if (!label && !valueText) continue;
    rows.push({ label, value: valueText });
  }
  return rows;
}

export function detailsEqual(a: PortfolioDetailRow[], b: PortfolioDetailRow[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
