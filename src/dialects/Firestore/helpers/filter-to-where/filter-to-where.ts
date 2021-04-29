import { Filter, Where } from "../../../../types";

export const filterToWhere = <T>(filters: Filter<T>[]): Where<T>[] => {
  const whereCollection: Where<T>[] = [];

  filters.map((filter: Filter<T>) => {
    const isRange = filter.operator === "range";
    if (isRange) {
      const from: Where<T> = {
        fieldPath: filter.field,
        operator: ">=",
        value: filter.value?.[0],
      };
      const to: Where<T> = {
        fieldPath: filter.field,
        operator: "<=",
        value: filter.value?.[1],
      };
      whereCollection.push(from, to);
    } else {
      whereCollection.push({
        ...filter,
        fieldPath: filter.field,
      } as Where<T>);
    }

    return filter;
  });

  return whereCollection;
};
