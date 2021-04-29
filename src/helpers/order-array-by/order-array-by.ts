import { OrderBy } from "../..";
import { dynamicSortMultiple } from "../dynamic-sort-multiple/dynamic-sort-multiple";

export const orderArrayBy = <T>(array: T[], orders: OrderBy<T>[]): T[] => {
  return array.sort(dynamicSortMultiple(...orders));
};
