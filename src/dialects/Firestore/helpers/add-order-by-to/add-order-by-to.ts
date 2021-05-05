/* eslint-disable no-param-reassign */
/* eslint-disable no-undef */
import { firestore } from "firebase-admin";
import {
  ComparisonsArray,
  OrderBy,
  Where,
  WhereNested,
} from "../../../../types";
import { filterConditionsByOperators } from "../filter-conditions-by-operators/filter-conditions-by-operators";

/* 
  The Firestore does not allow to sort and filter, in the same query, with certain operators.
  See more: https://firebase.google.com/docs/firestore/query-data/order-limit-data#limitations 
*/
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

/*
  If there is a filter with a range comparison (<, <=, >, >=), your first ordering must be on the same field. 
  If the query does not contain the sort, it is included.
  See more: https://firebase.google.com/docs/firestore/query-data/order-limit-data#limitations
*/
const checkOrderByOfComparisons = <T>(
  orderByCollection: OrderBy<T>[],
  whereCollection: (Where<T> | WhereNested<T, any>)[],
): OrderBy<T>[] => {
  const whereWithComparisons = filterConditionsByOperators(
    whereCollection,
    ComparisonsArray,
  );
  const missingOrders = whereWithComparisons.reduce(
    (orders: OrderBy<T>[], where: Where<T>) => {
      const hasOrderForComparison =
        orderByCollection
          .map((order) => order.fieldPath)
          .includes(where.fieldPath) ||
        orders.some((order) => order.fieldPath === where.fieldPath);

      !hasOrderForComparison &&
        orders.push({ fieldPath: where.fieldPath, direction: "asc" });
      return orders;
    },
    [],
  );
  return [...missingOrders, ...orderByCollection];
};

export const addOrderByTo = <T>(
  query: firestore.Query,
  orderByCollection: OrderBy<T>[],
  whereCollection?: (Where<T> | WhereNested<T, any>)[],
): firestore.Query => {
  const order = whereCollection
    ? checkOrderByOfComparisons(orderByCollection, whereCollection)
    : orderByCollection;

  order.forEach((orderBy) => {
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
