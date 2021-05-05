/* eslint-disable no-undef */
/* eslint-disable import/no-unresolved */
import { DocumentData } from "@firebase/firestore-types";
import { firestore } from "firebase-admin";
import { Where, WhereNested } from "../../../../types";
import { groupConditionsByCompoundQueries } from "../group-conditions-by-compound-queries/group-conditions-by-compound-queries";

export const getConditionalQueries = <T>(
  collectionRef: firestore.CollectionReference<firestore.DocumentData>,
  whereCollection: (Where<T> | WhereNested<T, any>)[],
): firestore.Query<DocumentData>[] => {
  const queries = [] as firestore.Query<DocumentData>[];

  /* In some cases, it is necessary to group the queries due to the limitations of the Firestore: 
     https://firebase.google.com/docs/firestore/query-data/queries#query_limitations */
  const whereGroup = groupConditionsByCompoundQueries<T>(whereCollection);

  Object.values(whereGroup).forEach((whereArray: Where<T>[]) => {
    let query = collectionRef as firestore.Query;
    whereArray.forEach((where: Where<T>) => {
      const { fieldPath, operator, value } = where;
      query = query.where(
        fieldPath as string,
        operator as FirebaseFirestore.WhereFilterOp,
        value,
      );
    });
    queries.push(query);
  });
  return queries;
};
