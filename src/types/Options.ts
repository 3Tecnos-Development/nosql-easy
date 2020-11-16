import { Where, WhereNested } from "./Where";
import { OrderBy } from "./OrderBy";

export type Options<T, I = any> = {
  whereCollection?: Where<T>[] | WhereNested<T, I>[];
  orderByCollection?: OrderBy<T>[];
  limit?: number;
  offset?: number;
};
