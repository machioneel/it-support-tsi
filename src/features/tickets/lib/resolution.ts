/**
 * How long a ticket took, in whole minutes.
 *
 * `resolution_duration_minutes` is stored rather than derived because the
 * dashboard averages it directly. Nothing was writing it — the detail modal set
 * `finished_at` and stopped — so the "Rata-rata waktu penyelesaian" card stayed
 * empty no matter how many tickets were closed.
 */
export function resolutionMinutes(
  createdAt: string,
  finishedAt: string | null | undefined
): number | null {
  if (!finishedAt) return null;
  const start = new Date(createdAt).getTime();
  const end = new Date(finishedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  // A completion time before the ticket existed is data entry error, not a
  // negative duration. Callers validate first; this is the second line.
  return end < start ? null : Math.round((end - start) / 60000);
}
