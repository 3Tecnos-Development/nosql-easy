/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/indent */
/* eslint-disable indent */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-undef */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-prototype-builtins */
/* eslint-disable import/no-unresolved */
import { MapEnv } from "map-env-node";
import firebase, { firestore } from "firebase-admin";
import { DocumentData, UpdateData } from "@firebase/firestore-types";

import { IFirestoreCredential } from "./interfaces";
import { IDataTransformPort, IRepository } from "../../interfaces";
import { FieldNested, Options, Where } from "../../types";
import {
  emptyToUndefined,
  paginateArray,
  transformFirestoreTypes,
} from "../../helpers";
import { DataTransformAdapter } from "../../adapters/dataTransformer";

export class FirestoreRepository implements IRepository {
  private firestore: firestore.Firestore;

  private dataTransform: IDataTransformPort;

  private getCredentials = (): IFirestoreCredential => {
    let projectId: string;
    let clientEmail: string;
    let privateKey: string;
    let databaseURL: string;

    if (process.env.FIRESTORE_CREDENTIAL) {
      const firestoreCredential = MapEnv.get<IFirestoreCredential>(
        "FIRESTORE_CREDENTIAL",
      );

      projectId = firestoreCredential.credential.projectId;
      clientEmail = firestoreCredential.credential.clientEmail;
      privateKey = firestoreCredential.credential.privateKey;
      databaseURL = firestoreCredential.databaseURL;
    } else {
      projectId = process.env.FIRESTORE_PROJECT_ID!;
      clientEmail = process.env.FIRESTORE_CLIENT_EMAIL!;
      if (process.env.FIRESTORE_PRIVATE_KEY_BASE64) {
        const privateKeyB64 = Buffer.from(
          process.env.FIRESTORE_PRIVATE_KEY_BASE64,
          "base64",
        );
        privateKey = privateKeyB64.toString("utf8");
      } else {
        privateKey = process.env.FIRESTORE_PRIVATE_KEY!;
      }
      databaseURL = process.env.FIRESTORE_DATABASE_URL!;
    }

    return {
      credential: {
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      },
      databaseURL,
    };
  };

  constructor() {
    this.dataTransform = DataTransformAdapter;
    if (!firebase.apps.length) {
      const firestoreCredential = this.getCredentials();
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

  private removeUndefinedProps<T>(data: T): T {
    const obj = data as any;
    Object.keys(obj).forEach((key) => {
      if (obj[key] === undefined) {
        delete obj[key];
        return;
      }
      const propertyIsAnObject =
        obj[key] && typeof obj[key] === "object" && !(obj[key] instanceof Date);
      if (propertyIsAnObject) {
        this.removeUndefinedProps(obj[key]);
        const objectWithoutProperties = !Object.keys(obj[key]).length;
        if (objectWithoutProperties) delete obj[key];
      }
    });
    return data;
  }

  async insert<T, R = T>(
    collection: string,
    data: T,
    ResponseClass?: new () => R,
  ): Promise<R> {
    const obj = await this.dataTransform.toObject(data);
    this.removeUndefinedProps(obj);
    let response = {} as R;

    await this.firestore
      .collection(collection)
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
    this.removeUndefinedProps(obj);

    if (obj.hasOwnProperty("id")) {
      await this.firestore
        .collection(collection)
        .doc((obj as any).id!)
        .set(obj);

      const response = ResponseClass
        ? await this.dataTransform.transform<R, unknown>(ResponseClass, obj, {
            excludeExtraneousValues: true,
          })
        : transformFirestoreTypes(obj as R);
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
    this.removeUndefinedProps(value);
    const docRef = await this.firestore.collection(collection).doc(id);
    await docRef.update(
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
    this.removeUndefinedProps(value);
    const docRef = await this.firestore.collection(collection).doc(id);
    await docRef.update(
      arrayFieldName,
      firebase.firestore.FieldValue.arrayRemove(value),
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
      ? await this.dataTransform.transform(ResponseClass, elements, {
          excludeExtraneousValues: true,
        })
      : transformFirestoreTypes(elements);

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
    const snapShot = await this.firestore
      .collection(collection)
      .where(fieldPath, operator, value)
      .get();
    let elements = this.docToModel<R>(snapShot);
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
      ? await this.dataTransform.transform(ResponseClass, elements, {
          excludeExtraneousValues: true,
        })
      : transformFirestoreTypes(elements);
    return elements;
  }

  async update<T>(collection: string, data: T): Promise<void> {
    const obj = await this.dataTransform.toObject(data);
    this.removeUndefinedProps(obj);
    if (obj.hasOwnProperty("id")) {
      const snapShot = this.firestore
        .collection(collection)
        .doc((obj as any).id);
      if (snapShot) {
        delete (obj as any).id;
        await snapShot.update(obj);
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
      let obj;

      if (typeof value === "object") {
        obj = await this.dataTransform.toObject(value);
        this.removeUndefinedProps(obj);
      } else obj = value;

      if ((field as FieldNested<T, C>).parent) {
        path = `${(field as FieldNested<T, C>).parent}.${
          (field as FieldNested<T, C>).child
        }`;
      }
      await snapShot.update(path, obj);
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
        this.removeUndefinedProps(obj);
      } else obj = newValue;

      if ((field as FieldNested<T, C>).parent) {
        path = `${(field as FieldNested<T, C>).parent}.${
          (field as FieldNested<T, C>).child
        }`;
      }

      const element: UpdateData = {};

      const elementToRemove = firestore.FieldValue.arrayRemove(prevValue);
      element[path] = elementToRemove;
      console.log("elementToRemove", prevValue);

      await snapShot.update(element);

      element[path] = firestore.FieldValue.arrayUnion(obj);
      console.log("elementToAdd", obj);

      await snapShot.update(element);

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
      return Promise.reject("The field is not an array.");

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
}
