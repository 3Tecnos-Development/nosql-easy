export type OrderByDirection = "desc" | "asc";

export type OrderBy<K> = {
  fieldPath: K;
  direction: OrderByDirection;
};
