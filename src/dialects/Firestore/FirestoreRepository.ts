/* eslint-disable @typescript-eslint/indent */
/* eslint-disable indent */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-undef */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-prototype-builtins */
/* eslint-disable import/no-unresolved */
import { MapEnv } from "map-env-node";
import firebase, { firestore } from "firebase-admin";
import { DocumentData } from "@firebase/firestore-types";
import { IFirestoreCredential } from "./interfaces";
import { IRepository } from "../../interfaces";
import { DataTransformAdapter } from "../../adapters/dataTransformer";
import { FieldNested, Options, OrderBy, Where } from "../../types";
import { paginateArray } from "../../helpers";

export class FirestoreRepository implements IRepository {
  private firestore: firestore.Firestore;

  constructor() {
    if (!firebase.apps.length) {
      const firestoreCredential = MapEnv.get<IFirestoreCredential>(
        "FIRESTORE_CREDENTIAL",
      );
      firebase.initializeApp({
        credential: firebase.credential.cert({
          projectId: firestoreCredential.credential.projectId,
          clientEmail: firestoreCredential.credential.clientEmail,
          privateKey: firestoreCredential.credential.privateKey,
        }),
        databaseURL: firestoreCredential.databaseURL,
      });
    }
    this.firestore = firebase.firestore();
  }

  private docToModel<T>(
    snapShot: firestore.QuerySnapshot<firestore.DocumentData>,
  ): T[] {
    const elems = [] as T[];
    if (!snapShot.empty) {
      snapShot.forEach((doc) => {
        const elem = { id: doc.id, ...(doc.data() as T) };
        elems.push(elem);
      });
    }
    return elems;
  }

  async insert<T, R = T>(
    collection: string,
    data: T,
    ResponseClass?: new () => R,
  ): Promise<R> {
    const dataJson = JSON.parse(JSON.stringify(data));
    let response = {} as R;

    await this.firestore
      .collection(collection)
      .add(dataJson)
      .then(async (docRef) => {
        Object.assign(dataJson, { id: docRef.id });
        response = ResponseClass
          ? await DataTransformAdapter.transform(ResponseClass, dataJson, {
              excludeExtraneousValues: true,
            })
          : dataJson;
      })
      .catch((error) => {
        throw new Error(error);
      });
    return response;
  }

  async insertWithId<T, R = T>(
    collection: string,
    data: T,
    ResponseClass?: new () => R,
  ): Promise<R> {
    const dataJson = JSON.parse(JSON.stringify(data));
    let response: R = (data as unknown) as R;

    if (dataJson.hasOwnProperty("id")) {
      await this.firestore
        .collection(collection)
        .doc(dataJson.id!)
        .set(dataJson);

      response = ResponseClass
        ? await DataTransformAdapter.transform(ResponseClass, dataJson, {
            excludeExtraneousValues: true,
          })
        : dataJson;
      return response;
    }
    return Promise.reject("Id property not provided.");
  }

  async insertElementInArray(
    collection: string,
    id: string,
    arrayFieldName: string,
    value: any,
  ): Promise<void> {
    const data = JSON.parse(JSON.stringify(value));
    const docRef = await this.firestore.collection(collection).doc(id);
    await docRef.update(
      arrayFieldName,
      firebase.firestore.FieldValue.arrayUnion(data),
    );
  }

  async removeElementInArray(
    collection: string,
    id: string,
    arrayFieldName: string,
    value: any,
  ): Promise<void> {
    const data = JSON.parse(JSON.stringify(value));
    const docRef = await this.firestore.collection(collection).doc(id);
    await docRef.update(
      arrayFieldName,
      firebase.firestore.FieldValue.arrayRemove(data),
    );
  }

  generateDocumentId(collection: string): DocumentData {
    const document = this.firestore.collection(collection).doc();
    return document;
  }

  async getCollection<T, R = T>(
    collection: string,
    options?: Options<T>,
    ResponseClass?: new () => R,
  ): Promise<R[]> {
    let query = this.firestore.collection(collection) as firestore.Query;

    if (options) {
      if (options.whereCollection) {
        options.whereCollection.forEach((where: any) => {
          const fieldPath = where.fieldPath
            ? where.fieldPath
            : `${where.fieldParent}.${where.fieldNested}`;
          query = query.where(
            fieldPath,
            where.operator.toString() as FirebaseFirestore.WhereFilterOp,
            where.value,
          );
        });
      }

      if (options.orderByCollection) {
        options.orderByCollection.forEach((orderBy) => {
          query = query.orderBy(
            orderBy.fieldPath as string,
            orderBy.direction as FirebaseFirestore.OrderByDirection,
          );
        });
      }

      query = options.limit ? query.limit(options.limit) : query;
      query = options.offset ? query.offset(options.offset) : query;
    }

    const snapShot = await query.get();
    let elements = this.docToModel<R>(snapShot);

    elements = ResponseClass
      ? await DataTransformAdapter.transform(ResponseClass, elements, {
          excludeExtraneousValues: true,
        })
      : elements;

    return elements;
  }

  async getById<T, R = T>(
    collection: string,
    id: string,
    ResponseClass?: new () => R,
  ): Promise<R> {
    let data = {} as R;
    const snapShot = await this.firestore.collection(collection).doc(id).get();
    if (snapShot?.data()) {
      Object.assign(data, { id: snapShot?.id });
      data = ResponseClass
        ? await DataTransformAdapter.transform(
            ResponseClass,
            snapShot?.data(),
            { excludeExtraneousValues: true },
          )
        : await DataTransformAdapter.transform(data, snapShot?.data());
    }
    return data;
  }

  async getByValue<T, R = T>(
    collection: string,
    fieldPath: string,
    value: any,
    operator: FirebaseFirestore.WhereFilterOp = "==",
    ResponseClass?: new () => R,
  ): Promise<R[]> {
    const snapShot = await this.firestore
      .collection(collection)
      .where(fieldPath, operator, value)
      .get();
    let elements = this.docToModel<R>(snapShot);
    elements = ResponseClass
      ? await DataTransformAdapter.transform(ResponseClass, elements, {
          excludeExtraneousValues: true,
        })
      : elements;
    return elements;
  }

  async getByValueOrdered<T, R = T>(
    collection: string,
    fieldPath: string,
    whereFilter: FirebaseFirestore.WhereFilterOp = "==",
    value: any,
    fieldOrder: string,
    direction: FirebaseFirestore.OrderByDirection = "desc",
    ResponseClass?: new () => R,
  ): Promise<R[]> {
    const snapShot = await this.firestore
      .collection(collection)
      .where(fieldPath, whereFilter, value)
      .orderBy(fieldOrder, direction)
      .get();
    let elements = this.docToModel<R>(snapShot);
    elements = ResponseClass
      ? await DataTransformAdapter.transform(ResponseClass, elements, {
          excludeExtraneousValues: true,
        })
      : elements;
    return elements;
  }

  async update<T>(collection: string, data: T): Promise<void> {
    const dataJSON = JSON.parse(JSON.stringify(data));
    if (dataJSON.hasOwnProperty("id")) {
      const snapShot = this.firestore.collection(collection).doc(dataJSON.id);
      if (snapShot) {
        delete dataJSON.id;
        await snapShot.update(dataJSON);
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
      const dataJSON =
        typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
      if ((field as FieldNested<T, C>).parent) {
        path = `${(field as FieldNested<T, C>).parent}.${
          (field as FieldNested<T, C>).child
        }`;
      }
      await snapShot.update(path, dataJSON);
      return Promise.resolve();
    }
    return Promise.reject();
  }

  async remove(collection: string, id: string): Promise<void> {
    const snapShot = this.firestore.collection(collection).doc(id);
    await snapShot.delete();
  }

  async exists(collection: string, id: string): Promise<boolean> {
    const snapShot = await this.firestore.collection(collection).doc(id).get();
    return snapShot.exists;
  }

  async getSizeCollection<T>(
    collection: string,
    options?: Options<T>,
  ): Promise<number> {
    let query = this.firestore.collection(collection) as firestore.Query;

    if (options?.whereCollection) {
      options.whereCollection.forEach((where: any) => {
        const fieldPath = where.fieldPath
          ? where.fieldPath
          : `${where.fieldParent}.${where.fieldNested}`;
        query = query.where(
          fieldPath,
          where.operator.toString() as FirebaseFirestore.WhereFilterOp,
          where.value,
        );
      });
    }

    const snapShot = await query.get();

    return snapShot.size;
  }

  async getPaginatedCollection<T, F, R = T>(
    collection: string,
    queryParams?: any,
    FilterClass?: new () => F,
    orderBy?: OrderBy<T>,
    minimumSizeToPaginated?: number,
    ResponseClass?: new () => R,
  ): Promise<R[]> {
    const filterCollection: Where<T>[] = [];
    let options: Options<T> = {};

    if (queryParams && Object.keys(queryParams).length > 0) {
      const filterClass: (new () => F) | undefined = FilterClass || undefined;

      const filter = DataTransformAdapter.transform<new () => F, any>(
        filterClass,
        queryParams,
      );

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

      if (paginationEnabled) {
        let { limit, page } = queryParams;
        limit = limit ? parseInt(limit, 10) : 10;
        page = page && page > 0 ? parseInt(page, 10) : 1;
        options = {
          limit,
          offset: limit * (page - 1),
        };
      }
      options.whereCollection = filterCollection;
    }
    options.orderByCollection = orderBy ? [orderBy] : undefined;
    return this.getCollection<T, R>(collection, options, ResponseClass);
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
    const array = doc ? ((doc as any)[field] as []) : [];
    const arrayPaginated =
      minimumSizeToPaginated && array.length < minimumSizeToPaginated
        ? array
        : paginateArray(array, pageNumber, pageSize);

    const response: R[] = ResponseClass
      ? await DataTransformAdapter.transform(
          ResponseClass,
          <any[]>arrayPaginated,
          {
            excludeExtraneousValues: true,
          },
        )
      : (arrayPaginated as R[]);

    return response;
  }
}
