/* eslint-disable no-param-reassign */
import {
  ComparisonsArray,
  EqualsOperator,
  NotEqualsOperator,
  UniqueClausesArray,
  Where,
  WhereGroup,
  WhereNested,
} from "../../../../types";
import { filterConditionsByOperators } from "../filter-conditions-by-operators/filter-conditions-by-operators";

export const groupConditionsByCompoundQueries = <T>(
  whereCollection: (Where<T> | WhereNested<T, any>)[],
): WhereGroup<T> => {
  let whereGroup: WhereGroup<T> = {};
  const whereWithUniqueClauses = filterConditionsByOperators(
    whereCollection,
    UniqueClausesArray,
  );
  const whereWithComparisons = filterConditionsByOperators(whereCollection, [
    ...ComparisonsArray,
    NotEqualsOperator,
  ]);
  const remainingWhere = filterConditionsByOperators(whereCollection, [
    EqualsOperator,
  ]);

  // add groups where with comparisons
  whereGroup = ((whereWithComparisons as any[]).reduce(
    (group: any, where: any) => {
      let newWhereCollection = group?.[where.fieldPath]
        ? [...group[where.fieldPath], where]
        : [where];

      newWhereCollection =
        whereWithUniqueClauses?.length > 0
          ? [...newWhereCollection, whereWithUniqueClauses.shift()]
          : newWhereCollection;

      group = { ...group, [where.fieldPath]: newWhereCollection };

      return group;
    },
    [],
  ) as unknown) as WhereGroup<T>;

  // add groups where with unique clauses
  whereWithUniqueClauses.forEach((where: Where<T>) => {
    whereGroup = { ...whereGroup, [where.fieldPath]: [where] };
  });

  // add groups remaining where
  if (remainingWhere?.length > 0) {
    const firstWhereGroup = Object.entries(whereGroup)?.[0];
    if (firstWhereGroup) {
      const [firstField, firstWhereCollection] = firstWhereGroup;
      whereGroup[firstField] = [...firstWhereCollection, ...remainingWhere];
    } else whereGroup = { remainingWhere };
  }

  return whereGroup;
};
