export const paginateArray = <T>(
  array: T[],
  pageNumber: number = 1,
  pageSize: number = 10,
): T[] => {
  const page = pageNumber > 0 ? pageNumber : 1;
  const start = pageSize * (page - 1);
  const end = page * pageSize;
  const result = array && array.length > 0 ? array.slice(start, end) : [];

  return result;
};
