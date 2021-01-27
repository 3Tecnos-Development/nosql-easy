/* eslint-disable @typescript-eslint/indent */
/* eslint-disable no-plusplus */
/* eslint-disable import/no-extraneous-dependencies */
import "reflect-metadata";
import dotenv from "dotenv";
import faker from "faker";
import { NoSqlEasyConfig } from "../../Config";
import { DialectType } from "../../types/DialectType";
import { NoSqlEasy } from "../../index";
import { FakeFilter, FakeItemResponse, FakeResponse } from "../entities";
import { OrderBy } from "../../types";

dotenv.config();

jest.setTimeout(30000);

interface IFakeItem {
  itemId: string;
  value: number;
  total: number;
}

interface IFake {
  id?: string;
  name: string;
  age: number;
  email: string;
  isDad?: boolean;
  items: IFakeItem[];
}

NoSqlEasyConfig.setDialect(process.env.DB_DIALECT as DialectType);

let dynamicId: string;
let insertTestId: string;

const mockFake = (id: string): FakeResponse => {
  return {
    id,
  };
};

const mockFakeItem = (value: number): FakeItemResponse => {
  return {
    value,
  };
};

const mockItems = (size: number = 10): IFakeItem[] => {
  const data: IFakeItem[] = [];
  for (let i = 0; i < size; i++) {
    const f: IFakeItem = {
      itemId: faker.random.uuid(),
      value: faker.random.number(),
      total: faker.random.number(),
    };
    data.push(f);
  }
  return data;
};

describe("NoSqlEasy", () => {
  it("Testando o método insert", async () => {
    const fake: IFake = {
      name: "Lindsay",
      age: 36,
      email: "lindsay@3tecnos.com.br",
      items: [],
    };
    const newFake = await new NoSqlEasy().insert<IFake>("fakes", fake);
    dynamicId = newFake.id!;
    expect(newFake.id!.length > 0).toBe(true);
  });

  it("Testando o método exists", async () => {
    const exists = await new NoSqlEasy().exists("fakes", dynamicId);
    expect(exists).toBe(true);
  });

  it("Testando o método insertWithId", async () => {
    const noSqlEasy = new NoSqlEasy();
    const fake: IFake = {
      id: "123456",
      name: "Jesus",
      age: 33,
      email: "jesus@3tecnos.com.br",
      isDad: true,
      items: mockItems(20),
    };
    const newFake = await noSqlEasy.insertWithId<IFake>("fakes", fake);
    const exists = await noSqlEasy.exists("fakes", newFake.id!);
    expect(exists).toBe(true);
  });

  it("Testando o método getById", async () => {
    const noSqlEasy = new NoSqlEasy();
    const fake = await noSqlEasy.getById<IFake>("fakes", "123456");
    expect(fake.id === "123456").toBe(true);
  });

  it("Testando o método getByValue", async () => {
    const noSqlEasy = new NoSqlEasy();
    const fakes = await noSqlEasy.getByValue<IFake>(
      "fakes",
      "email",
      "jesus@3tecnos.com.br",
    );
    expect(fakes.length > 0 && fakes[0].id === "123456").toBe(true);
  });

  it("Testando o método getByValueOrdered", async () => {
    const noSqlEasy = new NoSqlEasy();
    const fakes = await noSqlEasy.getByValueOrdered<IFake>(
      "fakes",
      "age",
      ">=",
      30,
      "age",
      "asc",
    );
    const compare =
      fakes.length > 0 && fakes[0].age === 33 && fakes[1].age === 36;
    expect(compare).toBe(true);
  });

  it("Testando o método getPaginatedCollection", async () => {
    const noSqlEasy = new NoSqlEasy();
    const queryParams = { isDad: true, limit: 1, page: 1 };
    const orderBy: OrderBy<IFake> = { fieldPath: "age", direction: "desc" };

    const fakes = await noSqlEasy.getPaginatedCollection<IFake, FakeFilter>(
      "fakes",
      queryParams,
      FakeFilter,
      orderBy,
    );

    const compare = fakes.length > 0 && fakes.length <= 1 && fakes[0].isDad;
    expect(compare).toBe(true);
  });

  it("Testando o método getPaginatedCollection com o parâmetro minimumSizeToPaginated", async () => {
    const noSqlEasy = new NoSqlEasy();
    const queryParams = { limit: 1, page: 1 };
    const sizeCollection = await noSqlEasy.getSizeCollection("fakes");

    const docs = await noSqlEasy.getPaginatedCollection<IFake, FakeFilter>(
      "fakes",
      queryParams,
      FakeFilter,
      undefined,
      sizeCollection + 1,
    );

    const docsPaginated = await noSqlEasy.getPaginatedCollection<
      IFake,
      FakeFilter
    >("fakes", queryParams, FakeFilter, undefined, sizeCollection - 1);

    expect(docs?.length).toEqual(sizeCollection);
    expect(docsPaginated?.length).toEqual(queryParams.limit);
  });

  it("Testando o método update", async () => {
    const fakeDad: IFake = {
      id: dynamicId,
      name: "Lindsay",
      age: 36,
      email: "lindsay@3tecnos.com.br",
      isDad: true,
      items: [],
    };
    const noSqlEasy = new NoSqlEasy();
    await noSqlEasy.update<IFake>("fakes", fakeDad);
    const fakes = await noSqlEasy.getByValue<IFake>(
      "fakes",
      "email",
      "lindsay@3tecnos.com.br",
    );
    expect(fakes.length > 0 && fakes[0].name === "Lindsay").toBe(true);
  });

  it("Testando o método updateField", async () => {
    const noSqlEasy = new NoSqlEasy();
    await noSqlEasy.updateField<IFake>(
      "fakes",
      dynamicId,
      "email",
      "lindsay.3tecnos@gmail.com",
    );
    const fakes = await noSqlEasy.getByValue<IFake>(
      "fakes",
      "email",
      "lindsay.3tecnos@gmail.com",
    );
    expect(fakes.length > 0 && fakes[0].name === "Lindsay").toBe(true);
  });

  it("Testando o método insert com o retorno customizado", async () => {
    const fake: IFake = {
      name: "Moises",
      age: 42,
      email: "moirocar@gmail.com",
      items: [],
    };

    const noSqlEasy = new NoSqlEasy();

    const response = await noSqlEasy.insert("fakes", fake, FakeResponse);
    insertTestId = response.id;

    const toCompare: FakeResponse = {
      id: insertTestId,
    };

    expect(response).toEqual(toCompare);
  });

  it("Testando o método insertWithId com o retorno customizado", async () => {
    const noSqlEasy = new NoSqlEasy();
    const fake: IFake = {
      id: "111111",
      name: "Jesus",
      age: 33,
      email: "jesus@3tecnos.com.br",
      isDad: true,
      items: mockItems(20),
    };
    const response = await noSqlEasy.insertWithId("fakes", fake, FakeResponse);

    const toCompare: FakeResponse = {
      id: response.id,
    };

    expect(response).toEqual(toCompare);
  });

  it("Testando o método getCollection com o retorno customizado", async () => {
    const response = await new NoSqlEasy().getCollection<FakeResponse>(
      "fakes",
      undefined,
      FakeResponse,
    );

    const objectResponse = response.find((i) => i.id === "123456");
    const toCompare = mockFake(objectResponse?.id!);

    expect(objectResponse).toEqual(toCompare);
  });

  it("Testando o método getPaginatedCollection com o retorno customizado", async () => {
    const response = await new NoSqlEasy().getPaginatedCollection(
      "fakes",
      {
        limit: 5,
        page: 1,
      },
      undefined,
      undefined,
      undefined,
      FakeResponse,
    );
    const objectResponse = response.find((i) => i.id === "123456");
    const toCompare = mockFake(objectResponse?.id!);

    expect(objectResponse).toEqual(toCompare);
  });

  it("Testando o método getByValue com retorno customizado", async () => {
    const noSqlEasy = new NoSqlEasy();

    const response = await noSqlEasy.getByValue<IFake, FakeResponse>(
      "fakes",
      "email",
      "jesus@3tecnos.com.br",
      undefined,
      FakeResponse,
    );

    const toCompare = mockFake(response[0].id!);

    expect(response[0]).toEqual(toCompare);
  });

  it("Testando o método getByValueOrdered com retorno customizado", async () => {
    const noSqlEasy = new NoSqlEasy();

    const response = await noSqlEasy.getByValueOrdered<IFake, FakeResponse>(
      "fakes",
      "email",
      "==",
      "jesus@3tecnos.com.br",
      "age",
      "asc",
      FakeResponse,
    );

    const toCompare = mockFake(response[0].id!);

    expect(response[0]).toEqual(toCompare);
  });

  it("Testando o método getById com retorno customizado", async () => {
    const noSqlEasy = new NoSqlEasy();

    const response = await noSqlEasy.getById<IFake, FakeResponse>(
      "fakes",
      "123456",
      FakeResponse,
    );
    const toCompare = mockFake(response.id!);

    expect(response).toEqual(toCompare);
  });

  it("Testando o método getPaginatedArray com retorno customizado", async () => {
    const noSqlEasy = new NoSqlEasy();

    const response = await noSqlEasy.getPaginatedArray<
      IFake,
      IFakeItem,
      FakeItemResponse
    >("fakes", "123456", "items", 1, 5, undefined, FakeItemResponse);

    const toCompare = mockFakeItem(response[0].value);

    expect(response[0]).toEqual(toCompare);
  });

  it("Testando o método getPaginatedArray", async () => {
    const noSqlEasy = new NoSqlEasy();
    const pageSize = 5;
    const pageNumber = 1;
    const lastIndex = pageNumber * pageSize - 1;

    const arrayPaginated = await noSqlEasy.getPaginatedArray<IFake, IFakeItem>(
      "fakes",
      "123456",
      "items",
      pageNumber,
      pageSize,
    );

    const fake = await noSqlEasy.getById<IFake>("fakes", "123456");
    const toCompare = fake.items;

    expect(toCompare).toEqual(expect.arrayContaining(arrayPaginated));
    expect(arrayPaginated.length).toEqual(pageSize);
    expect(toCompare[lastIndex]).toMatchObject(
      arrayPaginated[arrayPaginated.length - 1],
    );
  });

  it("Testando o método getPaginatedArray com o parâmetro minimumSizeToPaginated", async () => {
    const noSqlEasy = new NoSqlEasy();
    const pageSize = 5;
    const pageNumber = 1;

    const fake = await noSqlEasy.getById<IFake>("fakes", "123456");
    const toCompare = fake.items;

    const array = await noSqlEasy.getPaginatedArray<IFake, IFakeItem>(
      "fakes",
      "123456",
      "items",
      pageNumber,
      pageSize,
      fake.items?.length + 1,
    );

    const arrayPaginated = await noSqlEasy.getPaginatedArray<IFake, IFakeItem>(
      "fakes",
      "123456",
      "items",
      pageNumber,
      pageSize,
      fake.items?.length - 1,
    );

    expect(toCompare).toEqual(array);
    expect(toCompare).toEqual(expect.arrayContaining(arrayPaginated));
    expect(arrayPaginated.length).toEqual(pageSize);
  });

  it("Testando o método getPaginatedArray passando um campo que não seja array e esperando o erro", async () => {
    const noSqlEasy = new NoSqlEasy();
    const pageSize = 5;
    const pageNumber = 1;

    expect(
      noSqlEasy.getPaginatedArray<IFake, IFakeItem>(
        "fakes",
        "123456",
        "email",
        pageNumber,
        pageSize,
      ),
    ).rejects.toEqual("The field is not an array.");
  });

  it("Testando o método remove", async () => {
    const noSqlEasy = new NoSqlEasy();
    await noSqlEasy.remove("fakes", insertTestId);
    await noSqlEasy.remove("fakes", dynamicId);
    await noSqlEasy.remove("fakes", "123456");
    await noSqlEasy.remove("fakes", "000000");
    await noSqlEasy.remove("fakes", "111111");
    const [existsOne, existsSecond] = await Promise.all([
      noSqlEasy.exists("fakes", dynamicId),
      noSqlEasy.exists("fakes", "123456"),
    ]);
    expect(existsOne && existsSecond).toBe(false);
  });
});
