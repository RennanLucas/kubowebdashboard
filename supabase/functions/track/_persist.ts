type InsertError = { code?: string; message?: string };
type InsertResult = { error: InsertError | null };

/** Keep new rows in a mixed retry batch. A failed multi-row INSERT is atomic;
 * split only known event-id collisions, never swallow unrelated constraints.
 * This works with the existing partial indexes, without a database migration.
 */
export async function insertIdempotently<T>(
  rows: T[],
  insert: (batch: T[]) => PromiseLike<InsertResult>,
  eventIdIndex: "idx_events_event_id" | "idx_pageviews_event_id",
): Promise<number> {
  if (!rows.length) return 0;
  const { error } = await insert(rows);
  if (!error) return rows.length;
  if (error.code !== "23505" || !error.message?.includes(`"${eventIdIndex}"`)) {
    throw error;
  }
  if (rows.length === 1) return 0;
  const middle = Math.floor(rows.length / 2);
  // Sequential halves also deduplicate repeated IDs inside the same batch.
  return await insertIdempotently(rows.slice(0, middle), insert, eventIdIndex)
    + await insertIdempotently(rows.slice(middle), insert, eventIdIndex);
}
