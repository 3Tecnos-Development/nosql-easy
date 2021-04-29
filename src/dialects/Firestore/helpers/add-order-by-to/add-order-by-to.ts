/* eslint-disable no-param-reassign */
/* eslint-disable no-undef */
import { firestore } from "firebase-admin";
import { OrderBy } from "../../../../types";

export const addOrderByTo = <T>(
  query: firestore.Query,
  orderByCollection: OrderBy<T>[],
): firestore.Query => {
  orderByCollection.forEach((orderBy) => {
    const { fieldPath, direction } = orderBy;
    query = query.orderBy(
      fieldPath as string,
      direction as FirebaseFirestore.OrderByDirection,
    );
  });
  return query;
};
