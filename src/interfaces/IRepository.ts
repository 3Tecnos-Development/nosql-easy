/* eslint-disable no-unused-vars */
import { Options } from "../types/Options";
import { WhereFilterOp } from "../types/Where";
import { OrderByDirection } from "../types/OrderBy";

export interface IRepository {
  insert<T>(collection: string, data: T): Promise<T>;
  insertWithId<T>(collection: string, data: T): Promise<T>;
  insertElementInArray(collection: string, id: string, arrayFieldName: string, Value: any): Promise<void>;
  getCollection<T>(collection: string, options?: Options<T>): Promise<T[]>;
  getById<T>(collection: string, id: string): Promise<T>;
  getByValue<T>(collection: string, fieldPath: string, value: any, whereFilter?: WhereFilterOp): Promise<T[]>;
  getByValueOrdered<T>(
    collection: string,
    fieldPath: string,
    whereFilter: WhereFilterOp,
    value: any,
    fieldOrder: string,
    direction?: OrderByDirection,
  ): Promise<T[]>;
  update<T>(collection: string, data: T): Promise<void>;
  updateField<T>(collection: string, id: string, fieldName: keyof T, value: any): Promise<void>;
  remove(collection: string, id: string): Promise<void>;
  exists(collection: string, id: string): Promise<boolean>;
}
