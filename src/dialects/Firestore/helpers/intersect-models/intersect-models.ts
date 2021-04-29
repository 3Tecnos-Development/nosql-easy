/* eslint-disable import/no-unresolved */
import { DocumentData } from "@firebase/firestore-types";
import { firestore } from "firebase-admin";
import { docToModel } from "../doc-to-model/doc-to-model";

export const intersectModels = <R>(
  snapShots: firestore.QuerySnapshot<DocumentData>[],
): R[] => {
  let result: R[] = [];
  snapShots.forEach((snapShot, index: number) => {
    const elements = docToModel<R>(snapShot);
    if (index === 0) result = elements;
    else
      result = elements.filter((doc) =>
        result.some((resultDoc) => (resultDoc as any).id === (doc as any).id),
      );
  });
  return result;
};
