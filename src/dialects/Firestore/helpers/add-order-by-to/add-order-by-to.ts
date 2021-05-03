/* eslint-disable no-param-reassign */
/* eslint-disable no-undef */
import { firestore } from "firebase-admin";
import { OrderBy, Where, WhereNested } from "../../../../types";

const rejectQueryIfOrderByIsNotInAgreement = <T>(
  orderField: keyof T,
  whereCollection: (Where<T> | WhereNested<T, any>)[],
) => {
  const operatorsNotAllowedInOrderAndWhere = ["==", "in"];
  const hasWhereWithOperatorsNotAllowed = whereCollection.some(
    (where: any) =>
      (where.fieldPath === orderField ||
        `${where.fieldParent}.${where.fieldNested}` === orderField) &&
      operatorsNotAllowedInOrderAndWhere.includes(where.operator),
  );
  if (hasWhereWithOperatorsNotAllowed)
    throw new Error(
      "It is not allowed to order a query by a field included in an equality (==) or (in) the clause.",
    );
};

export const addOrderByTo = <T>(
  query: firestore.Query,
  orderByCollection: OrderBy<T>[],
  whereCollection?: (Where<T> | WhereNested<T, any>)[],
): firestore.Query => {
  orderByCollection.forEach((orderBy) => {
    const { fieldPath, direction } = orderBy;
    !!whereCollection &&
      rejectQueryIfOrderByIsNotInAgreement(fieldPath, whereCollection);
    query = query.orderBy(
      fieldPath as string,
      direction as FirebaseFirestore.OrderByDirection,
    );
  });
  return query;
};
