export declare type FilterOperator =
  | "<"
  | "<="
  | "=="
  | ">="
  | ">"
  | "!="
  | "range";

interface IFilter<TFilter> {
  field: keyof TFilter;
  operator: FilterOperator;
  value: any;
}
export declare type Filter<TFilter> = IFilter<TFilter>;
