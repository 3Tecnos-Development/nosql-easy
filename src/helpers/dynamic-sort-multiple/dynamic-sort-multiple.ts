import { OrderBy } from "../../types";
import { dynamicSort } from "../dynamic-sort/dynamic-sort";

export const dynamicSortMultiple = <T>(...props: OrderBy<T>[]) => {
  return (obj1: T, obj2: T) => {
    let result = 0;
    props.some((prop: OrderBy<T>) => {
      result = dynamicSort<T>(prop.fieldPath, prop.direction)(obj1, obj2);
      return result !== 0;
    });

    return result;
  };
};
