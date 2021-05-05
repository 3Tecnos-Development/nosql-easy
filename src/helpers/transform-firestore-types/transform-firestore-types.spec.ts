/* eslint-disable no-plusplus */
import faker from "faker";
import { transformFirestoreTypes } from "./transform-firestore-types";

interface IFakeTransform {
  id: string;
  name: string;
  birth: Date;
}

const mockData = (): IFakeTransform => {
  const data: IFakeTransform = {
    name: faker.random.word(),
    id: faker.random.uuid(),
    birth: faker.date.past(),
  };
  return data;
};

describe("transformFirestoreTypes", () => {
  it("should return the object with the data property in the Date javascript format", () => {
    const data = mockData();

    const response = transformFirestoreTypes(data);

    const compare = response && typeof response.birth.getMonth === "function";

    expect(compare).toBeTruthy();
  });
});
