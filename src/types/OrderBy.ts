
export type OrderByDirection = "desc" | "asc";

interface IOrderBy<K>{
  fieldPath: K;
  direction: OrderByDirection;
}

export type OrderBy<T> = IOrderBy<keyof T>;