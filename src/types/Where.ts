export type WhereFilterOp = "<" | "<=" | "==" | ">=" | ">" | "array-contains" | "in" | "array-contains-any";

export type Where<K> = {
  fieldPath: K;
  operator: WhereFilterOp;
  value: any;
};
