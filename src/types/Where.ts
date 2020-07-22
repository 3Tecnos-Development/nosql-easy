
export type WhereFilterOp =
  | '<'
  | '<='
  | '=='
  | '>='
  | '>'
  | 'array-contains'
  | 'in'
  | 'array-contains-any';

  interface IWhere<K>{
    fieldPath: K;
    operator: WhereFilterOp;
    value:any;
}

export type Where<T> = IWhere<keyof T>;
