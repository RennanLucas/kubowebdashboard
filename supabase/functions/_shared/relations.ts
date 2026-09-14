/** PostgREST embeddings may be a to-one object or an array without schema types. */
export function oneRelation<T>(relation: T | T[] | null | undefined): T | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation ?? null;
}
