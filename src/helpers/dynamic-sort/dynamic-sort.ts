import { OrderByDirection } from "../../types";

export const dynamicSort = <T>(
  property: keyof T,
  direction: OrderByDirection = "asc",
) => {
  const sortOrder = direction === "desc" ? -1 : 1;
  return (a: T, b: T) => {
    let result = 0;
    if (a[property] < b[property]) result = -1;
    else if (a[property] > b[property]) result = 1;

    return result * sortOrder;
  };
};
