/* eslint-disable no-array-constructor */
import { IRepository, IProvider } from "./interfaces";
import { Options } from "./types/Options";
import { IFirestoreCredential } from "./dialects/Firestore/interfaces";
import { FirestoreRepository } from "./dialects/Firestore";
import { NoSqlEasyConfig } from "./Config";
import {
  DialectType,
  FieldNested,
  OrderBy,
  OrderByDirection,
  Where,
  WhereFilterOp,
  WhereNested,
} from "./types";

export {
  DialectType,
  Options,
  OrderByDirection,
  OrderBy,
  WhereFilterOp,
  Where,
  WhereNested,
  FieldNested,
};

export { NoSqlEasyConfig };

export { IFirestoreCredential, FirestoreRepository };

export class NoSqlEasy implements IRepository {
  providers = Array<IProvider>();

  repository: IRepository;

  constructor() {
    this.providers = [
      { name: "Firestore", repository: new FirestoreRepository() },
    ];

    this.repository = this.getRepository();
  }

  private getRepository(): IRepository {
    const filter = this.providers.filter(
      (p) => p.name === NoSqlEasyConfig.getDialectName(),
    );
    if (filter.length > 0) {
      return filter[0].repository;
    }
    throw new Error("Provedor de Repositório não definido!");
  }

  insertWithId<T, R = T>(
    collection: string,
    data: T,
    ResponseClass?: new () => R,
  ): Promise<R> {
    return this.repository.insertWithId<T, R>(collection, data, ResponseClass);
  }

  insert<T, R = T>(
    collection: string,
    data: T,
    responseClass?: new () => R,
  ): Promise<R> {
    return this.repository.insert<T, R>(collection, data, responseClass);
  }

  insertElementInArray(
    collection: string,
    id: string,
    arrayFieldName: string,
    value: any,
  ): Promise<void> {
    return this.repository.insertElementInArray(
      collection,
      id,
      arrayFieldName,
      value,
    );
  }

  removeElementInArray(
    collection: string,
    id: string,
    arrayFieldName: string,
    value: any,
  ): Promise<void> {
    return this.repository.removeElementInArray(
      collection,
      id,
      arrayFieldName,
      value,
    );
  }

  getCollection<T, R = T>(
    collection: string,
    options?: Options<T>,
    ResponseClass?: new () => R,
  ): Promise<R[]> {
    return this.repository.getCollection<T, R>(
      collection,
      options,
      ResponseClass,
    );
  }

  getById<T, R = T>(
    collection: string,
    id: string,
    ResponseClass?: new () => R,
  ): Promise<R> {
    return this.repository.getById<T, R>(collection, id, ResponseClass);
  }

  getByValue<T, R = T>(
    collection: string,
    fieldPath: string,
    value: any,
    operator?: WhereFilterOp,
    ResponseClass?: new () => R,
  ): Promise<R[]> {
    return this.repository.getByValue<T, R>(
      collection,
      fieldPath,
      value,
      operator,
      ResponseClass,
    );
  }

  getByValueOrdered<T, R = T>(
    collection: string,
    fieldPath: string,
    whereFilter: WhereFilterOp,
    value: any,
    fieldOrder: string,
    direction?: OrderByDirection,
    ResponseClass?: new () => R,
  ): Promise<R[]> {
    return this.repository.getByValueOrdered<T, R>(
      collection,
      fieldPath,
      whereFilter,
      value,
      fieldOrder,
      direction,
      ResponseClass,
    );
  }

  update<T>(collection: string, data: T) {
    return this.repository.update<T>(collection, data);
  }

  updateField<T, C = any>(
    collection: string,
    id: string,
    field: keyof T | FieldNested<T, C>,
    value: any,
  ) {
    return this.repository.updateField(collection, id, field, value);
  }

  updateArray<T, C = any>(
    collection: string,
    id: string,
    field: keyof T | FieldNested<T, C>,
    prevValue: any,
    newValue: any,
  ) {
    return this.repository.updateArray(
      collection,
      id,
      field,
      prevValue,
      newValue,
    );
  }

  remove(collection: string, id: string): Promise<void> {
    return this.repository.remove(collection, id);
  }

  exists(collection: string, id: string): Promise<boolean> {
    return this.repository.exists(collection, id);
  }

  getSizeCollection<T>(
    collection: string,
    options?: Options<T>,
  ): Promise<number> {
    return this.repository.getSizeCollection<T>(collection, options);
  }

  getPaginatedCollection<T, F, R = T>(
    collection: string,
    queryParams?: any,
    FilterClass?: new () => F,
    minimumSizeToPaginated?: number,
    options?: Options<T>,
    ResponseClass?: new () => R,
  ): Promise<R[]> {
    return this.repository.getPaginatedCollection<T, F, R>(
      collection,
      queryParams,
      FilterClass,
      minimumSizeToPaginated,
      options,
      ResponseClass,
    );
  }

  getPaginatedArray<T, A, R = A>(
    collection: string,
    id: string,
    field: keyof T,
    pageNumber: number,
    pageSize?: number,
    minimumSizeToPaginated?: number,
    ResponseClass?: new () => R,
  ): Promise<R[]> {
    return this.repository.getPaginatedArray<T, A, R>(
      collection,
      id,
      field,
      pageNumber,
      pageSize,
      minimumSizeToPaginated,
      ResponseClass,
    );
  }
}
