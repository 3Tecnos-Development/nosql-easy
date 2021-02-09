import { Expose } from "class-transformer";

export class FakeFilter {
  @Expose()
  isDad: boolean;

  @Expose()
  name?: string;
}
