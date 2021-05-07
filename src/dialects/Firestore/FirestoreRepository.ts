/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
/* eslint-disable no-prototype-builtins */
/* eslint-disable indent */
/* eslint-disable @typescript-eslint/indent */
/* eslint-disable import/no-unresolved */
import firebase, { firestore } from "firebase-admin";
import { DocumentData, UpdateData } from "@firebase/firestore-types";

import { IDataTransformPort, IRepository } from "../../interfaces";
import {
  FieldNested,
  Options,
  OrderBy,
  Transaction,
  Where,
  WhereNested,
} from "../../types";
import {
  emptyToUndefined,
  orderArrayBy,
  paginateArray,
  removeUndefinedProps,
  transformFirestoreTypes,
} from "../../helpers";
import { DataTransformAdapter } from "../../adapters/dataTransformer";
import {
  addOrderByTo,
  docToModel,
  filterToWhere,
  getConditionalQueries,
  getCredentials,
  intersectModels,
} from "./helpers";

export class FirestoreRepository implements IRepository {
  private firestore: firestore.Firestore;

  protected transaction: firestore.Transaction | undefined;

  private dataTransform: IDataTransformPort;

  constructor() {
    this.dataTransform = DataTransformAdapter;
    if (!firebase.apps.length) {
      const firestoreCredential = getCredentials();
      const { credential } = firestoreCredential;
      firebase.initializeApp({
        credential: firebase.credential.cert({
          projectId: credential.projectId,
          clientEmail: credential.clientEmail,
          privateKey: credential.privateKey,
        }),
        databaseURL: firestoreCredential.databaseURL,
      });
    }
    this.firestore = firebase.firestore();
  }

  private async transform<T, R = T>(
    value: R[] | firestore.QuerySnapshot<firestore.DocumentData>,
    ClassType?: new () => R,
  ): Promise<R[]> {
    const result: R[] =
      value instanceof firestore.QuerySnapshot ? docToModel<R>(value) : value;
    return ClassType
      ? this.dataTransform.transform(ClassType, result, {
          excludeExtraneousValues: true,
        })
      : transformFirestoreTypes(result);
  }

  async insert<T, R = T>(
    collection: string,
    data: T,
    ResponseClass?: new () => R,
  ): Promise<R> {
    const obj = await this.dataTransform.toObject(data);
    removeUndefinedProps(obj);
    let response = {} as R;

    const collectionReference = this.firestore.collection(collection);

    this.transaction
      ? await this.transaction.set(collectionReference.doc(), obj)
      : await collectionReference
          .add(obj)
          .then(async (docRef) => {
            Object.assign(obj, { id: docRef.id });
            response = ResponseClass
              ? await this.dataTransform.transform(ResponseClass, obj, {
                  excludeExtraneousValues: true,
                })
              : transformFirestoreTypes(obj as R);
          })
          .catch((error) => {
            throw new Error(error);
          });

    return emptyToUndefined(response);
  }

  async insertWithId<T, R = T>(
    collection: string,
    data: T,
    ResponseClass?: new () => R,
  ): Promise<R> {
    const obj = await this.dataTransform.toObject(data);
    removeUndefinedProps(obj);

    if (obj.hasOwnProperty("id")) {
      const collectionReference = this.firestore.collection(collection);

      this.transaction
        ? await this.transaction.set(
            collectionReference.doc((obj as any).id!),
            obj,
          )
        : await collectionReference.doc((obj as any).id!).set(obj);

      const response = ResponseClass
        ? await this.dataTransform.transform<R, unknown>(ResponseClass, obj, {
            excludeExtraneousValues: true,
          })
        : transformFirestoreTypes(obj as R);

      return response;
    }
    return Promise.reject(new Error("Id property not provided."));
  }

  async insertElementInArray(
    collection: string,
    id: string,
    arrayFieldName: string,
    value: any,
  ): Promise<void> {
    removeUndefinedProps(value);
    const collectionReference = this.firestore.collection(collection);
    const docRef = await collectionReference.doc(id);

    const element: UpdateData = {};
    const elementToAdd = firebase.firestore.FieldValue.arrayUnion(value);
    element[arrayFieldName] = elementToAdd;

    this.transaction
      ? this.transaction.update(docRef, element)
      : await docRef.update(
          arrayFieldName,
          firebase.firestore.FieldValue.arrayUnion(value),
        );
  }

  async removeElementInArray(
    collection: string,
    id: string,
    arrayFieldName: string,
    value: any,
  ): Promise<void> {
    removeUndefinedProps(value);

    const collectionReference = this.firestore.collection(collection);
    const docRef = await collectionReference.doc(id);

    const element: UpdateData = {};
    const elementToRemove = firebase.firestore.FieldValue.arrayRemove(value);
    element[arrayFieldName] = elementToRemove;

    this.transaction
      ? this.transaction.update(docRef, element)
      : await docRef.update(
          arrayFieldName,
          firebase.firestore.FieldValue.arrayRemove(value),
        );
  }

  generateDocumentId(collection: string): DocumentData {
    const document = this.firestore.collection(collection).doc();
    return document;
  }

  // get collection without offset and limit
  private async getPartialCollection<T, R = T>(
    collection: string,
    whereCollection?: (Where<T> | WhereNested<T, any>)[],
    orderByCollection?: OrderBy<T>[],
    ResponseClass?: new () => R,
  ): Promise<R[] | firestore.Query<DocumentData>> {
    const collectionRef = this.firestore.collection(collection);
    let query = collectionRef as firestore.Query;

    const hasConditionals = whereCollection && whereCollection?.length > 0;

    // Where
    if (hasConditionals) {
      const queries = getConditionalQueries(collectionRef, whereCollection!);

      const hasCompoundQueries = queries.length > 1;
      if (hasCompoundQueries) {
        const promises = queries!.reduce(
          (
            result: Promise<firestore.QuerySnapshot<DocumentData>>[],
            q: firestore.Query<DocumentData>,
          ) => {
            const queryPromise = this.transaction
              ? this.transaction.get(q)
              : q.get();
            result.push(queryPromise);
            return result;
          },
          [],
        );

        const snapShots = await Promise.all(promises);
        const result = await this.transform(
          intersectModels<R>(snapShots),
          ResponseClass,
        );

        // Order By to Compound Queries
        !!orderByCollection &&
          orderArrayBy<R>(result, orderByCollection as any[]);

        return result;
      }
      query = queries.length > 0 ? queries[0] : query;
    }

    // Order By
    query = orderByCollection
      ? addOrderByTo<T>(query, orderByCollection, whereCollection)
      : query;

    return query;
  }

  async getCollection<T, R = T>(
    collection: string,
    options?: Options<T>,
    ResponseClass?: new () => R,
  ): Promise<R[]> {
    const {
      whereCollection,
      filterCollection,
      orderByCollection,
      offset,
      limit,
    } = options || {};

    const allWhereCollection = [
      ...(whereCollection ?? []),
      ...filterToWhere(filterCollection ?? []),
    ];

    const result = await this.getPartialCollection(
      collection,
      allWhereCollection,
      orderByCollection,
      ResponseClass,
    );

    // single query
    if (result instanceof firestore.Query) {
      let query = result;

      // Limit and Offset
      query = limit ? query.limit(limit) : query;
      query = offset ? query.offset(offset) : query;
      const snapShot = this.transaction
        ? await this.transaction.get(query)
        : await query.get();

      return this.transform(snapShot, ResponseClass);
    }

    // Limit and Offset to Compound Queries
    const endIndex = limit && offset ? limit + offset : limit;

    return result.slice(options?.offset, endIndex);
  }

  async getById<T, R = T>(
    collection: string,
    id: string,
    ResponseClass?: new () => R,
  ): Promise<R> {
    let data = {} as R;

    let snapShot: firestore.DocumentData | undefined = {};
    const doc = this.firestore.collection(collection).doc(id);

    snapShot = this.transaction
      ? await this.transaction.get(doc)
      : await doc.get();

    if (snapShot?.data()) {
      Object.assign(data, { id: snapShot?.id });
      data = ResponseClass
        ? await this.dataTransform.transform(ResponseClass, snapShot?.data(), {
            excludeExtraneousValues: true,
          })
        : await this.dataTransform.transform(data, snapShot?.data());
    }

    return emptyToUndefined(data);
  }

  async getByValue<T, R = T>(
    collection: string,
    fieldPath: string,
    value: any,
    operator: FirebaseFirestore.WhereFilterOp = "==",
    ResponseClass?: new () => R,
  ): Promise<R[]> {
    const doc = this.firestore
      .collection(collection)
      .where(fieldPath, operator, value);

    const snapShot = this.transaction
      ? await this.transaction.get(doc)
      : await doc.get();

    let elements = docToModel<R>(snapShot);
    elements = ResponseClass
      ? await this.dataTransform.transform(ResponseClass, elements, {
          excludeExtraneousValues: true,
        })
      : transformFirestoreTypes(elements);
    return elements;
  }

  async getByValueOrdered<T, R = T>(
    collection: string,
    fieldPath: string,
    whereFilter: FirebaseFirestore.WhereFilterOp,
    value: any,
    fieldOrder: string,
    direction: FirebaseFirestore.OrderByDirection = "desc",
    ResponseClass?: new () => R,
  ): Promise<R[]> {
    const doc = this.firestore
      .collection(collection)
      .where(fieldPath, whereFilter, value)
      .orderBy(fieldOrder, direction);

    const snapShot = this.transaction
      ? await this.transaction.get(doc)
      : await doc.get();

    let elements = docToModel<R>(snapShot);
    elements = ResponseClass
      ? await this.dataTransform.transform(ResponseClass, elements, {
          excludeExtraneousValues: true,
        })
      : transformFirestoreTypes(elements);
    return elements;
  }

  async update<T>(collection: string, data: T): Promise<void> {
    const obj = await this.dataTransform.toObject(data);
    removeUndefinedProps(obj);
    if (obj.hasOwnProperty("id")) {
      const snapShot = this.firestore
        .collection(collection)
        .doc((obj as any).id);
      if (snapShot) {
        delete (obj as any).id;

        this.transaction
          ? this.transaction.update(snapShot, obj)
          : await snapShot.update(obj);

        return Promise.resolve();
      }
    }
    return Promise.reject();
  }

  async updateField<T, C = any>(
    collection: string,
    id: string,
    field: keyof T | FieldNested<T, C>,
    value: any,
  ): Promise<void> {
    const snapShot = this.firestore.collection(collection).doc(id);
    if (snapShot) {
      let path = field as string;
      let obj: Object;

      if (typeof value === "object") {
        obj = await this.dataTransform.toObject(value);
        removeUndefinedProps(obj);
      } else obj = value;

      if ((field as FieldNested<T, C>).parent) {
        path = `${(field as FieldNested<T, C>).parent}.${
          (field as FieldNested<T, C>).child
        }`;
      }

      this.transaction
        ? this.transaction.update(snapShot, path, obj)
        : await snapShot.update(path, obj);

      return Promise.resolve();
    }
    return Promise.reject();
  }

  async updateArray<T, C = any>(
    collection: string,
    id: string,
    field: keyof T | FieldNested<T, C>,
    prevValue: any,
    newValue: any,
  ): Promise<void> {
    const snapShot = this.firestore.collection(collection).doc(id);
    if (snapShot) {
      let path = field as string;
      let obj: Object;

      if (typeof newValue === "object") {
        obj = await this.dataTransform.toObject(newValue);
        removeUndefinedProps(obj);
      } else obj = newValue;

      if ((field as FieldNested<T, C>).parent) {
        path = `${(field as FieldNested<T, C>).parent}.${
          (field as FieldNested<T, C>).child
        }`;
      }
      const element: UpdateData = {};
      const elementToRemove = firestore.FieldValue.arrayRemove(prevValue);
      const elementToAdd = firestore.FieldValue.arrayUnion(obj);
      element[path] = elementToRemove;

      if (this.transaction) {
        this.transaction.update(snapShot, element);
        element[path] = elementToAdd;
        this.transaction.update(snapShot, element);
      } else {
        await this.firestore.runTransaction(async (t) => {
          await t.update(snapShot, element);
          element[path] = elementToAdd;
          await t.update(snapShot, element);
        });
      }

      return Promise.resolve();
    }
    return Promise.reject();
  }

  async remove(collection: string, id: string): Promise<void> {
    const snapShot = this.firestore.collection(collection).doc(id);
    this.transaction
      ? await this.transaction.delete(snapShot)
      : await snapShot.delete();
  }

  async exists(collection: string, id: string): Promise<boolean> {
    const doc = this.firestore.collection(collection).doc(id);

    const snapShot = this.transaction
      ? await this.transaction.get(doc)
      : await doc.get();

    return snapShot.exists;
  }

  async getSizeCollection<T>(
    collection: string,
    options?: Options<T>,
  ): Promise<number> {
    const { whereCollection, filterCollection, orderByCollection } =
      options || {};

    const allWhereCollection = [
      ...(whereCollection ?? []),
      ...filterToWhere(filterCollection ?? []),
    ];

    const result = await this.getPartialCollection(
      collection,
      allWhereCollection,
      orderByCollection,
    );

    // single query
    if (result instanceof firestore.Query) {
      const query = result;
      const snapShot = this.transaction
        ? await this.transaction.get(query)
        : await query.get();

      return snapShot.size;
    }
    return result?.length;
  }

  async getPaginatedCollection<T, F, R = T>(
    collection: string,
    queryParams?: any,
    FilterClass?: new () => F,
    minimumSizeToPaginated?: number,
    options?: Options<T>,
    ResponseClass?: new () => R,
  ): Promise<R[]> {
    const filterCollection: Where<T>[] = [];
    const newOptions: Options<T> = options || {};

    if (queryParams && Object.keys(queryParams).length > 0) {
      const filter = FilterClass
        ? await this.dataTransform.transform<new () => F, any>(
            FilterClass,
            queryParams,
            { excludeExtraneousValues: true, enableImplicitConversion: true },
          )
        : {};

      Object.keys(filter).forEach((p: any) => {
        const val = (filter as any)[p];
        if (!!val || val === 0)
          filterCollection.push({ fieldPath: p, operator: "==", value: val });
      });
      let paginationEnabled = true;
      if (minimumSizeToPaginated) {
        const sizeCollection = await this.getSizeCollection(collection, {
          whereCollection: filterCollection,
        });
        paginationEnabled = sizeCollection >= minimumSizeToPaginated;
      }
      const isToDefineLimitAndOffset =
        paginationEnabled && !newOptions.limit && !newOptions.offset;

      if (isToDefineLimitAndOffset) {
        let { limit, page } = queryParams;
        limit = limit ? parseInt(limit, 10) : 10;
        page = page && page > 0 ? parseInt(page, 10) : 1;
        newOptions.limit = limit;
        newOptions.offset = limit * (page - 1);
      }
      newOptions.whereCollection = newOptions.whereCollection
        ? [...(newOptions.whereCollection as Where<T>[]), ...filterCollection]
        : filterCollection;
    }
    return this.getCollection<T, R>(collection, newOptions, ResponseClass);
  }

  async getPaginatedArray<T, A, R = A>(
    collection: string,
    id: string,
    field: keyof T,
    pageNumber: number,
    pageSize?: number,
    minimumSizeToPaginated?: number,
    ResponseClass?: new () => R,
  ): Promise<R[]> {
    const doc = await this.getById<T>(collection, id);
    const fieldValue = doc ? ((doc as any)[field] as []) : [];
    if (!Array.isArray(fieldValue))
      return Promise.reject(new Error("The field is not an array."));

    const arrayPaginated =
      minimumSizeToPaginated && fieldValue.length < minimumSizeToPaginated
        ? fieldValue
        : paginateArray(fieldValue, pageNumber, pageSize);

    const response: R[] = ResponseClass
      ? await this.dataTransform.transform(
          ResponseClass,
          <any[]>arrayPaginated,
          {
            excludeExtraneousValues: true,
          },
        )
      : arrayPaginated;

    return response;
  }

  executeTransaction<T>(
    // eslint-disable-next-line no-unused-vars
    transactionFunction: (t: any) => Promise<T>,
  ): Promise<T> {
    if (this.transaction) {
      throw new Error("Already exists one transaction started!");
    }

    return this.firestore.runTransaction<T>(transactionFunction);
  }

  clearTransaction(): void {
    this.transaction = undefined;
  }

  setTransaction(transaction: Transaction["transaction"]): void {
    this.transaction = transaction;
  }
}
