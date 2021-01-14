import {
  ClassTransformOptions,
  plainToClass,
  plainToClassFromExist,
} from "class-transformer";

export class DataTransformAdapter {
  static async transform<T, D>(
    type: T | any,
    data: D,
    options?: ClassTransformOptions,
  ): Promise<T> {
    let result: T;
    if (typeof type === "object") {
      result = plainToClassFromExist<T, D>(type, data, options);
    } else {
      result = plainToClass(type, data, options);
    }
    return Promise.resolve(result);
  }
}
