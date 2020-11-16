/* eslint-disable no-unused-vars */
import { Options } from "../types/Options";
import { WhereFilterOp } from "../types/Where";
import { OrderByDirection, OrderBy } from "../types/OrderBy";
import { FieldNested } from "../types";

export interface IRepository {
  insert<T>(collection: string, data: T): Promise<T>;
  insertWithId<T>(collection: string, data: T): Promise<T>;
  insertElementInArray(collection: string, id: string, arrayFieldName: string, Value: any): Promise<void>;
  removeElementInArray(collection: string, id: string, arrayFieldName: string, value: any): Promise<void>;
  getCollection<T>(collection: string, options?: Options<T>): Promise<T[]>;
  getPaginatedCollection<T, F>(
    collection: string,
    queryParams?: any,
    FilterClass?: new () => F,
    orderBy?: OrderBy<T>,
  ): Promise<T[]>;
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
  updateField<T, C = any>(
    collection: string,
    id: string,
    field: keyof T | FieldNested<T, C>,
    value: any,
  ): Promise<void>;
  remove(collection: string, id: string): Promise<void>;
  exists(collection: string, id: string): Promise<boolean>;
  getSizeCollection<T>(collection: string, options?: Options<T>): Promise<number>;
}
