/* eslint-disable no-param-reassign */
import {
  ClassTransformOptions,
  plainToClass,
  plainToClassFromExist,
} from "class-transformer";

const transformFirestoreTypes = <T>(obj: T): T => {
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

export class DataTransformAdapter {
  static async transform<T, D>(
    type: T | any,
    data: D,
    options?: ClassTransformOptions,
  ): Promise<T> {
    let result: T;
    if (typeof type === "object") {
      result = plainToClassFromExist<T, D>(
        type,
        transformFirestoreTypes(data),
        options,
      );
    } else {
      result = plainToClass(type, transformFirestoreTypes(data), options);
    }
    return Promise.resolve(result);
  }
}
