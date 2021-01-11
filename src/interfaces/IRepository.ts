/* eslint-disable no-unused-vars */
import { Options } from "../types/Options";
import { WhereFilterOp } from "../types/Where";
import { OrderByDirection, OrderBy } from "../types/OrderBy";
import { FieldNested } from "../types";

export interface IRepository {
  insert<T, R>(
    collection: string,
    data: T,
    responseClass?: new () => R,
  ): Promise<R>;
  insertWithId<T, R>(
    collection: string,
    data: T,
    ResponseClass?: new () => R,
  ): Promise<R>;
  insertElementInArray(
    collection: string,
    id: string,
    arrayFieldName: string,
    Value: any,
  ): Promise<void>;
  removeElementInArray(
    collection: string,
    id: string,
    arrayFieldName: string,
    value: any,
  ): Promise<void>;
  getCollection<T, R = T>(
    collection: string,
    options?: Options<T>,
    ResponseClass?: new () => R,
  ): Promise<R[]>;
  getPaginatedCollection<T, F, R = T>(
    collection: string,
    queryParams?: any,
    FilterClass?: new () => F,
    orderBy?: OrderBy<T>,
    ResponseClass?: new () => R,
  ): Promise<R[]>;
  getById<T>(collection: string, id: string): Promise<T>;
  getByValue<T, R = T>(
    collection: string,
    fieldPath: string,
    value: any,
    whereFilter?: WhereFilterOp,
    ResponseClass?: new () => R,
  ): Promise<R[]>;
  getByValueOrdered<T, R = T>(
    collection: string,
    fieldPath: string,
    whereFilter: WhereFilterOp,
    value: any,
    fieldOrder: string,
    direction?: OrderByDirection,
    ResponseClass?: new () => R,
  ): Promise<R[]>;
  update<T>(collection: string, data: T): Promise<void>;
  updateField<T, C = any>(
    collection: string,
    id: string,
    field: keyof T | FieldNested<T, C>,
    value: any,
  ): Promise<void>;
  remove(collection: string, id: string): Promise<void>;
  exists(collection: string, id: string): Promise<boolean>;
  getSizeCollection<T>(
    collection: string,
    options?: Options<T>,
  ): Promise<number>;
}
