/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-prototype-builtins */
/* eslint-disable import/no-unresolved */
/* eslint-disable no-undef */
/* eslint-disable class-methods-use-this */

import { MapEnv } from "map-env-node";
import { plainToClassFromExist } from "class-transformer";
import firebase, { firestore } from "firebase-admin";
import { DocumentData } from "@firebase/firestore-types";
import { IFirestoreCredential } from "./interfaces/IFirestoreCredential";
import { IRepository } from "../../interfaces/IRepository";
import { Options } from "../../types";

export class FirestoreRepository implements IRepository {
  private firestore: firestore.Firestore;

  constructor() {
    if (!firebase.apps.length) {
      const firestoreCredential = MapEnv.get<IFirestoreCredential>("FIRESTORE_CREDENTIAL");
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

  async insert<T>(collection: string, data: T): Promise<T> {
    const dataJson = JSON.parse(JSON.stringify(data));

    await this.firestore
      .collection(collection)
      .add(dataJson)
      .then((docRef) => {
        Object.assign(data, { id: docRef.id });
      })
      .catch((error) => {
        throw new Error(error);
      });

    return data;
  }

  async insertWithId<T>(collection: string, data: T): Promise<T> {
    const dataJson = JSON.parse(JSON.stringify(data));

    if (dataJson.hasOwnProperty("id")) {
      await this.firestore.collection(collection).doc(dataJson.id!).set(dataJson);
      return dataJson;
    }
    return Promise.reject("Id property not provided.");
  }

  async insertElementInArray(collection: string, id: string, arrayFieldName: string, value: any): Promise<void> {
    const data = JSON.parse(JSON.stringify(value));
    const docRef = await this.firestore.collection(collection).doc(id);
    await docRef.update(arrayFieldName, firebase.firestore.FieldValue.arrayUnion(data));
  }

  generateDocumentId(collection: string): DocumentData {
    const document = this.firestore.collection(collection).doc();
    return document;
  }

  async insertWithID<T>(data: T, document: DocumentData): Promise<T> {
    const dataJson = JSON.parse(JSON.stringify(data));
    await document.set(dataJson);

    return data;
  }

  async getCollection<T>(collection: string, options?: Options<T>): Promise<T[]> {
    let query = this.firestore.collection(collection) as firestore.Query;

    if (options) {
      if (options.whereCollection) {
        options.whereCollection.forEach((where) => {
          query = query.where(
            (where.fieldPath as unknown) as string,
            where.operator.toString() as FirebaseFirestore.WhereFilterOp,
            where.value,
          );
        });
      }

      if (options.orderByCollection) {
        options.orderByCollection.forEach((orderBy) => {
          query = query.orderBy(
            (orderBy.fieldPath as unknown) as string,
            orderBy.direction as FirebaseFirestore.OrderByDirection,
          );
        });
      }

      query = options.limit ? query.limit(options.limit) : query;
      query = options.offset ? query.offset(options.offset) : query;
    }
    const snapShot = await query.get();
    const elements = this.docToModel<T>(snapShot);
    return elements;
  }

  async getById<T>(collection: string, id: string): Promise<T> {
    let data = {} as T;
    const snapShot = await this.firestore.collection(collection).doc(id).get();
    if (snapShot?.data()) {
      data = plainToClassFromExist(data, snapShot?.data());
      Object.assign(data, { id: snapShot?.id });
    }
    return data;
  }

  async getByValue<T>(
    collection: string,
    fieldPath: string,
    value: any,
    operator: FirebaseFirestore.WhereFilterOp = "==",
  ): Promise<T[]> {
    const snapShot = await this.firestore.collection(collection).where(fieldPath, operator, value).get();
    const elements = this.docToModel<T>(snapShot);
    return elements;
  }

  async getByValueOrdered<T>(
    collection: string,
    fieldPath: string,
    whereFilter: FirebaseFirestore.WhereFilterOp = "==",
    value: any,
    fieldOrder: string,
    direction: FirebaseFirestore.OrderByDirection = "desc",
  ): Promise<T[]> {
    const snapShot = await this.firestore
      .collection(collection)
      .where(fieldPath, whereFilter, value)
      .orderBy(fieldOrder, direction)
      .get();
    const elements = this.docToModel<T>(snapShot);
    return elements;
  }

  private docToModel<T>(snapShot: firestore.QuerySnapshot<firestore.DocumentData>): T[] {
    const elems = [] as T[];
    if (!snapShot.empty) {
      snapShot.forEach((doc) => {
        const elem = { id: doc.id, ...(doc.data() as T) };
        elems.push(elem);
      });
    }
    return elems;
  }

  async update<T>(collection: string, data: T): Promise<void> {
    const dataJSON = JSON.parse(JSON.stringify(data));
    if (dataJSON.hasOwnProperty("id")) {
      const snapShot = this.firestore.collection(collection).doc(dataJSON.id);
      if (snapShot) {
        await snapShot.update(dataJSON);
        return Promise.resolve();
      }
    }
    return Promise.reject();
  }

  async updateField<T>(collection: string, id: string, fieldName: keyof T, value: any): Promise<void> {
    const snapShot = this.firestore.collection(collection).doc(id);
    if (snapShot) {
      await snapShot.update(fieldName as string, value);
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

  async getSizeCollection<T>(collection: string, options?: Options<T>): Promise<number> {
    let query = this.firestore.collection(collection) as firestore.Query;

    if (options) {
      if (options.whereCollection) {
        options.whereCollection.forEach((where) => {
          query = query.where(
            where.fieldPath as string,
            where.operator.toString() as FirebaseFirestore.WhereFilterOp,
            where.value,
          );
        });
      }
    }

    const snapShot = await query.get();

    return snapShot.size;
  }
}
