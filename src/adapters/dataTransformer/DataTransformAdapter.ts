/* eslint-disable no-param-reassign */
import {
  classToPlain,
  ClassTransformOptions,
  plainToClass,
  plainToClassFromExist,
} from "class-transformer";
import { transformFirestoreTypes } from "../../helpers";
import { IDataTransformPort } from "../../interfaces";

export const DataTransformAdapter: IDataTransformPort = class {
  static transform<T, D>(
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

  static toObject<T>(
    data: T,
    options?: ClassTransformOptions,
  ): Promise<Object> {
    const result = classToPlain<T>(data, options);
    return Promise.resolve(result);
  }
};
