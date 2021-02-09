/* eslint-disable no-param-reassign */
export const transformFirestoreTypes = <T>(obj: T): T => {
  Object.keys(obj).forEach((key) => {
    const newObj = (obj as any)[key];
    if (!newObj) return;
    if (typeof newObj === "object" && "toDate" in newObj) {
      (obj as any)[key] = newObj.toDate();
    } else if (typeof newObj === "object") {
      transformFirestoreTypes(newObj);
    }
  });
  return obj;
};
