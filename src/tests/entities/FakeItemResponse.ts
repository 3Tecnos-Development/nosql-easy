import { Expose } from "class-transformer";

export class FakeItemResponse {
  @Expose()
  value: number;
}
