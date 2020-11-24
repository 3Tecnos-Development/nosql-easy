/* eslint-disable no-array-constructor */
import { IRepository } from "./interfaces/IRepository";
import { IProvider } from "./interfaces/IProvider";
import { Options } from "./types/Options";
import { OrderBy, OrderByDirection, Where, WhereFilterOp, DialectType, FieldNested, WhereNested } from "./types";
import { IFirestoreCredential } from "./dialects/Firestore/interfaces/IFirestoreCredential";
import { FirestoreRepository } from "./dialects/Firestore/FirestoreRepository";
import { NoSqlEasyConfig } from "./Config";

export { IProvider, IRepository };

export { NoSqlEasyConfig };

export { DialectType, Options, OrderByDirection, OrderBy, WhereFilterOp, Where, WhereNested, FieldNested };

export { IFirestoreCredential, FirestoreRepository };

export class NoSqlEasy implements IRepository {
  providers = Array<IProvider>();

  repository: IRepository;

  constructor() {
    this.providers = [{ name: "Firestore", repository: new FirestoreRepository() }];

    this.repository = this.getRepository();
  }

  private getRepository(): IRepository {
    const filter = this.providers.filter((p) => p.name === NoSqlEasyConfig.getDialectName());
    if (filter.length > 0) {
      return filter[0].repository;
    }
    throw new Error("Provedor de Repositório não definido!");
  }

  insertWithId<T, R>(collection: string, data: T): Promise<R> {
    return this.repository.insertWithId<T, R>(collection, data);
  }

  insert<T, R>(collection: string, data: T): Promise<R> {
    return this.repository.insert<T, R>(collection, data);
  }

  insertElementInArray(collection: string, id: string, arrayFieldName: string, value: any): Promise<void> {
    return this.repository.insertElementInArray(collection, id, arrayFieldName, value);
  }

  removeElementInArray(collection: string, id: string, arrayFieldName: string, value: any): Promise<void> {
    return this.repository.removeElementInArray(collection, id, arrayFieldName, value);
  }

  getCollection<T>(collection: string, options?: Options<T>): Promise<T[]> {
    return this.repository.getCollection<T>(collection, options);
  }

  getById<T>(collection: string, id: string): Promise<T> {
    return this.repository.getById(collection, id);
  }

  getByValue<T>(collection: string, fieldPath: string, value: any, operator?: WhereFilterOp): Promise<T[]> {
    return this.repository.getByValue<T>(collection, fieldPath, value, operator);
  }

  getByValueOrdered<T>(
    collection: string,
    fieldPath: string,
    whereFilter: WhereFilterOp,
    value: any,
    fieldOrder: string,
    direction?: OrderByDirection,
  ) {
    return this.repository.getByValueOrdered<T>(collection, fieldPath, whereFilter, value, fieldOrder, direction);
  }

  update<T>(collection: string, data: T) {
    return this.repository.update<T>(collection, data);
  }

  updateField<T, C = any>(collection: string, id: string, field: keyof T | FieldNested<T, C>, value: any) {
    return this.repository.updateField(collection, id, field, value);
  }

  remove(collection: string, id: string): Promise<void> {
    return this.repository.remove(collection, id);
  }

  exists(collection: string, id: string): Promise<boolean> {
    return this.repository.exists(collection, id);
  }

  getSizeCollection<T>(collection: string, options?: Options<T>): Promise<number> {
    return this.repository.getSizeCollection<T>(collection, options);
  }

  getPaginatedCollection<T, F>(
    collection: string,
    queryParams?: any,
    FilterClass?: (new () => F) | undefined,
    orderBy?: OrderBy<T>,
  ): Promise<T[]> {
    return this.repository.getPaginatedCollection<T, F>(collection, queryParams, FilterClass, orderBy);
  }
}
