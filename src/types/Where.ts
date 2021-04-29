/* eslint-disable @typescript-eslint/indent */

export const UniqueClausesArray = [
  "array-contains",
  "in",
  "array-contains-any",
] as const;
export const ComparisonsArray = ["<", "<=", ">=", ">", "!="] as const;
export const EqualOperatorOp = "==" as const;

export declare type UniqueClauses = typeof UniqueClausesArray[number];

export declare type Comparisons = typeof ComparisonsArray[number];

export declare type EqualOperator = typeof EqualOperatorOp;

export declare type WhereFilterOp = EqualOperator | Comparisons | UniqueClauses;

interface IWhere<K> {
  fieldPath: K;
  operator: WhereFilterOp;
  value: any;
}
export declare type Where<T> = IWhere<keyof T>;

interface IWhereNested<Parent, Child> {
  fieldParent: Parent;
  fieldNested: Child;
  operator: WhereFilterOp;
  value: any;
}

export declare type WhereNested<Parent, Child> = IWhereNested<
  keyof Parent,
  keyof Child
>;

export type WhereGroup<T> = {
  [field: string]: Where<T>[];
};
