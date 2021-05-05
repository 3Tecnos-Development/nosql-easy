import { Where, WhereFilterOp, WhereNested } from "../../../../types";

export const filterConditionsByOperators = <T>(
  whereCollection: (Where<T> | WhereNested<T, any>)[],
  operators: readonly WhereFilterOp[],
): Where<T>[] => {
  return (whereCollection as any[])
    .filter((where: Where<T> | WhereNested<T, any>) => {
      return operators.includes(where.operator);
    })
    .map((where) => ({
      fieldPath: where.fieldPath
        ? where.fieldPath
        : `${where.fieldParent}.${where.fieldNested}`,
      operator: where.operator,
      value: where.value,
    }));
};
