import { Expose } from "class-transformer";

export class FakeResponse {
  @Expose()
  id: string;
}
