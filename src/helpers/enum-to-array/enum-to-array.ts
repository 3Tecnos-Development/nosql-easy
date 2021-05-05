/* eslint-disable no-plusplus */
export const enumToArray = (_enum: Object): string[] => {
  return Object.values(_enum).filter((value) => typeof value === "string");
};
