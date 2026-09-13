const DAY = 86400000;
export interface AbsolutePeriod { start: string; end: string }

function dayTime(value: string): number {
  const time = Date.parse(value + "T00:00:00.000Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(time)
    || new Date(time).toISOString().slice(0, 10) !== value) {
    throw new Error("INVALID_PERIOD: Escolha datas válidas.");
  }
  return time;
}

/** UTC calendar days, inclusive bounds. Retention limits AGE, not just width. */
export function analyticsPeriod(
  params: URLSearchParams, days: number, maxHistoryDays: number, now = new Date(),
) {
  const today = dayTime(now.toISOString().slice(0, 10));
  const start = params.get("start");
  const end = params.get("end");
  if ((start === null) !== (end === null)) throw new Error("INVALID_PERIOD: Informe início e fim.");
  const endTime = end === null ? today : dayTime(end);
  const startTime = start === null ? endTime - (days - 1) * DAY : dayTime(start);
  if (!Number.isInteger(days) || days < 1 || startTime > endTime || endTime > today) {
    throw new Error("INVALID_PERIOD: O período deve terminar até hoje.");
  }
  const earliest = today - (maxHistoryDays - 1) * DAY;
  if (startTime < earliest) {
    throw new Error(`HISTORY_LIMIT_EXCEEDED: Seu plano permite os últimos ${maxHistoryDays} dias.`);
  }
  const length = (endTime - startTime) / DAY + 1;
  const iso = (time: number) => new Date(time).toISOString().slice(0, 10);
  return {
    start: iso(startTime), end: iso(endTime), days: length,
    // Never read the previous period outside the same entitlement window.
    previousStart: iso(Math.max(earliest, startTime - length * DAY)),
    previousEnd: iso(startTime - DAY),
    comparisonAvailable: startTime - length * DAY >= earliest,
  };
}
