import { plainToClass, plainToClassFromExist } from "class-transformer";

export class DataTransformAdapter {
  static async transform<T, D>(type: T | any, data: D): Promise<T> {
    let result: T;
    if (typeof type === "object") {
      result = plainToClassFromExist<T, D>(type, data, {
        excludeExtraneousValues: true,
      });
    } else {
      result = plainToClass(type, data, {
        excludeExtraneousValues: true,
      });
    }
    return Promise.resolve(result);
  }
}
