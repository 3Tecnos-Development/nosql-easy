import { Where, WhereNested } from "./Where";
import { OrderBy } from "./OrderBy";
import { Filter } from "./Filter";

export type Options<T, I = any> = {
  whereCollection?: Where<T>[] | WhereNested<T, I>[];
  orderByCollection?: OrderBy<T>[];
  filterCollection?: Filter<T>[];
  limit?: number;
  offset?: number;
};
