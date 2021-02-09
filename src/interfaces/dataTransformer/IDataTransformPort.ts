/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClassTransformOptions } from "class-transformer";

export interface IDataTransformPort {
  transform<T, D>(
    type: T | any,
    data: D,
    options?: ClassTransformOptions,
  ): Promise<T>;

  toObject<T>(data: T, options?: ClassTransformOptions): Promise<Object>;
}
