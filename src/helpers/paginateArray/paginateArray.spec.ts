/* eslint-disable no-plusplus */
import faker from "faker";
import { paginateArray } from "./paginateArray";

interface IFake {
  id: string;
  name: string;
  age: number;
}

const mockArray = (size: number = 10): IFake[] => {
  const data: IFake[] = [];
  for (let i = 0; i < size; i++) {
    const f: IFake = {
      name: faker.random.words(3),
      age: faker.random.number(80),
      id: faker.random.uuid(),
    };
    data.push(f);
  }
  return data;
};

describe("paginateArray", () => {
  it("should return the paginated array", () => {
    const array = mockArray(20);
    const pageSize = 5;
    const pageNumber = 2;
    const lastIndex = pageNumber * pageSize - 1;

    const arrayPaginated = paginateArray(array, pageNumber, pageSize);

    expect(array).toEqual(expect.arrayContaining(arrayPaginated));
    expect(arrayPaginated.length).toEqual(pageSize);
    expect(array[lastIndex]).toMatchObject(
      arrayPaginated[arrayPaginated.length - 1],
    );
  });
});
