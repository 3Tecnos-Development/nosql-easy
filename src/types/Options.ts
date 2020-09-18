import { Where } from "./Where";
import { OrderBy } from "./OrderBy";

export type Options<T> = {
  whereCollection?: Where<T>[];
  orderByCollection?: OrderBy<T>[];
  limit?: number;
  offset?: number;
};
