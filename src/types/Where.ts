export declare type WhereFilterOp = "<" | "<=" | "==" | ">=" | ">" | "array-contains" | "in" | "array-contains-any";
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

export declare type WhereNested<Parent, Child> = IWhereNested<keyof Parent, keyof Child>;
