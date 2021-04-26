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
import { Options, OrderBy, Where } from "../../types";
import { DataTransformAdapter } from "../../adapters/dataTransformer";

dotenv.config();

jest.setTimeout(30000);

interface IFakeItem {
  itemId: string;
  value: number;
  total: number;
  createAt?: Date;
}

interface IFake {
  id?: string;
  name: string;
  age: number;
  email: string;
  isDad?: boolean;
  items: IFakeItem[];
  birth?: Date;
}

class Fake {
  id?: string;

  name: string;

  birth: Date;

  child?: Fake;
}

NoSqlEasyConfig.setDialect(process.env.DB_DIALECT as DialectType);

let dynamicId: string;
let insertTestId: string;
let insertTransformTestId: string;
let insertWithDateTestId: string;

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
      createAt: faker.date.recent(),
    };
    data.push(f);
  }
  return data;
};

const makeSut = (): NoSqlEasy => {
  const sut = new NoSqlEasy();
  return sut;
};

describe("NoSqlEasy", () => {
  const sut = makeSut();
  it("Testando o método insert", async () => {
    const fake: IFake = {
      name: "Lindsay",
      age: 36,
      email: "lindsay@3tecnos.com.br",
      items: [],
      birth: undefined,
    };
    const newFake = await sut.insert<IFake>("fakes", fake);
    dynamicId = newFake.id!;
    expect(newFake.id!.length > 0).toBe(true);
    expect(newFake).not.toHaveProperty("birth");
  });

  it("Testando o método exists", async () => {
    const exists = await sut.exists("fakes", dynamicId);
    expect(exists).toBe(true);
  });

  it("Testando o método insertWithId", async () => {
    const fake: IFake = {
      id: "123456",
      name: "Jesus",
      age: 33,
      email: "jesus@3tecnos.com.br",
      isDad: true,
      items: mockItems(20),
      birth: undefined,
    };
    const newFake = await sut.insertWithId<IFake>("fakes", fake);
    const exists = await sut.exists("fakes", newFake.id!);
    expect(exists).toBe(true);
    expect(newFake).not.toHaveProperty("birth");
  });

  it("Testando o método getById - should be return undefined", async () => {
    const fake = await sut.getById<IFake>("fakes", "0");
    expect(fake).toBe(undefined);
  });

  it("Testando o método getById", async () => {
    const fake = await sut.getById<IFake>("fakes", "123456");
    expect(fake.id === "123456").toBeTruthy();
  });

  it("Testando o método getByValue", async () => {
    const fakes = await sut.getByValue<IFake>(
      "fakes",
      "email",
      "jesus@3tecnos.com.br",
    );
    expect(fakes.length > 0 && fakes[0].id === "123456").toBeTruthy();
  });

  it("Testando o método getByValueOrdered", async () => {
    const fakes = await sut.getByValueOrdered<IFake>(
      "fakes",
      "age",
      ">=",
      30,
      "age",
      "asc",
    );
    const compare =
      fakes.length > 0 && fakes[0].age === 33 && fakes[1].age === 36;
    expect(compare).toBeTruthy();
  });

  it("Testando o método getPaginatedCollection", async () => {
    const queryParams = { isDad: true, limit: 1, page: 1 };
    const orderBy: OrderBy<IFake> = { fieldPath: "age", direction: "desc" };
    const options: Options<IFake> = { orderByCollection: [orderBy] };

    const fakes = await sut.getPaginatedCollection<IFake, FakeFilter>(
      "fakes",
      queryParams,
      FakeFilter,
      undefined,
      options,
    );

    const compare = fakes.length > 0 && fakes.length <= 1 && fakes[0].isDad;
    expect(compare).toBeTruthy();
  });

  it("Testando o método getPaginatedCollection com o parâmetro minimumSizeToPaginated", async () => {
    const queryParams = { limit: 1, page: 1 };
    const sizeCollection = await sut.getSizeCollection("fakes");

    const docs = await sut.getPaginatedCollection<IFake, FakeFilter>(
      "fakes",
      queryParams,
      FakeFilter,
      sizeCollection + 1,
      undefined,
    );

    const docsPaginated = await sut.getPaginatedCollection<IFake, FakeFilter>(
      "fakes",
      queryParams,
      FakeFilter,
      sizeCollection - 1,
      undefined,
    );

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
      birth: undefined,
    };
    await sut.update<IFake>("fakes", fakeDad);
    const fakes = await sut.getByValue<IFake>(
      "fakes",
      "email",
      "lindsay@3tecnos.com.br",
    );
    expect(fakes.length > 0 && fakes[0].name === "Lindsay").toBe(true);
    expect(fakes).not.toHaveProperty("birth");
  });

  it("Testando o método updateField", async () => {
    await sut.updateField<IFake>(
      "fakes",
      dynamicId,
      "email",
      "lindsay.3tecnos@gmail.com",
    );
    const fakes = await sut.getByValue<IFake>(
      "fakes",
      "email",
      "lindsay.3tecnos@gmail.com",
    );
    expect(fakes.length > 0 && fakes[0].name === "Lindsay").toBeTruthy();
  });

  it("Testando o método updateArray", async () => {
    const prevFake = await sut.getByValue<IFake>(
      "fakes",
      "email",
      "jesus@3tecnos.com.br",
    );

    const newFake = {
      ...prevFake[0].items[0],
      itemId: "updateArray",
    };

    await sut.updateArray<IFake>(
      "fakes",
      "123456",
      "items",
      prevFake[0].items[0],
      newFake,
    );

    const fakes = await sut.getByValue<IFake>(
      "fakes",
      "email",
      "jesus@3tecnos.com.br",
    );

    expect(fakes[0].items.some((i) => i.itemId === "updateArray")).toBeTruthy();
  });

  it("Testando o método insert com o retorno customizado", async () => {
    const fake: IFake = {
      name: "Moises",
      age: 42,
      email: "moirocar@gmail.com",
      items: [],
      birth: new Date(1988, 10, 10),
    };

    const response = await sut.insert("fakes", fake, FakeResponse);
    insertTestId = response.id;

    const toCompare: FakeResponse = {
      id: insertTestId,
    };

    expect(response).toEqual(toCompare);
  });

  it("Testando o método insertWithId com o retorno customizado", async () => {
    const fake: IFake = {
      id: "111111",
      name: "Jesus",
      age: 33,
      email: "jesus@3tecnos.com.br",
      isDad: true,
      items: mockItems(20),
      birth: new Date(1988, 10, 10),
    };
    const response = await sut.insertWithId("fakes", fake, FakeResponse);

    const toCompare: FakeResponse = {
      id: response.id,
    };

    expect(response).toEqual(toCompare);
  });

  it("Testando o método getCollection com o retorno customizado", async () => {
    const response = await sut.getCollection<FakeResponse>(
      "fakes",
      undefined,
      FakeResponse,
    );

    const objectResponse = response.find((i) => i.id === "123456");
    const toCompare = mockFake(objectResponse?.id!);

    expect(objectResponse).toEqual(toCompare);
  });

  it("Testando o método getPaginatedCollection com o retorno customizado", async () => {
    const response = await sut.getPaginatedCollection(
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
    const response = await sut.getByValue<IFake, FakeResponse>(
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
    const response = await sut.getByValueOrdered<IFake, FakeResponse>(
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
    const response = await sut.getById<IFake, FakeResponse>(
      "fakes",
      "123456",
      FakeResponse,
    );
    const toCompare = mockFake(response.id!);

    expect(response).toEqual(toCompare);
  });

  it("Testando o método getPaginatedArray com retorno customizado", async () => {
    const response = await sut.getPaginatedArray<
      IFake,
      IFakeItem,
      FakeItemResponse
    >("fakes", "123456", "items", 1, 5, undefined, FakeItemResponse);

    const toCompare = mockFakeItem(response[0].value);

    expect(response[0]).toEqual(toCompare);
  });

  it("Testando o método getPaginatedArray", async () => {
    const pageSize = 5;
    const pageNumber = 1;
    const lastIndex = pageNumber * pageSize - 1;

    const arrayPaginated = await sut.getPaginatedArray<IFake, IFakeItem>(
      "fakes",
      "123456",
      "items",
      pageNumber,
      pageSize,
    );

    const fake = await sut.getById<IFake>("fakes", "123456");
    const toCompare = fake.items;

    expect(toCompare).toEqual(expect.arrayContaining(arrayPaginated));
    expect(arrayPaginated.length).toEqual(pageSize);
    expect(toCompare[lastIndex]).toMatchObject(
      arrayPaginated[arrayPaginated.length - 1],
    );
  });

  it("Testando o método getPaginatedArray com o parâmetro minimumSizeToPaginated", async () => {
    const pageSize = 5;
    const pageNumber = 1;

    const fake = await sut.getById<IFake>("fakes", "123456");
    const toCompare = fake.items;

    const array = await sut.getPaginatedArray<IFake, IFakeItem>(
      "fakes",
      "123456",
      "items",
      pageNumber,
      pageSize,
      fake.items?.length + 1,
    );

    const arrayPaginated = await sut.getPaginatedArray<IFake, IFakeItem>(
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
    const pageSize = 5;
    const pageNumber = 1;

    expect(
      sut.getPaginatedArray<IFake, IFakeItem>(
        "fakes",
        "123456",
        "email",
        pageNumber,
        pageSize,
      ),
    ).rejects.toEqual("The field is not an array.");
  });

  it("Testando o retorno de documento com propriedade do tipo Date", async () => {
    const birth = new Date(1991, 3, 5);
    const fake: IFake = {
      id: "9876",
      name: "Fabiano",
      age: 29,
      email: "fabiano@3tecnos.com.br",
      isDad: false,
      items: [],
      birth,
    };
    await sut.insertWithId<IFake>("fakes", fake);

    const fakeResponse = await sut.getById<IFake>("fakes", "9876");
    expect(fakeResponse.birth).toEqual(birth);
  });

  it("Testando o método insert com DataTransform", async () => {
    const fake = {
      name: "Pedro Paulo",
      birth: undefined,
    };
    const fakeTransformed = await DataTransformAdapter.transform<Fake, unknown>(
      Fake,
      fake,
    );
    const newFake = await sut.insert<Fake>("fakes", fakeTransformed);
    insertTransformTestId = newFake.id!;
    expect(newFake.id!.length > 0).toBeTruthy();
  });

  it("Testando o método insertWithId com DataTransform", async () => {
    const fake = {
      id: "4334",
      name: "João Freitas",
      birth: new Date(2020, 5, 15),
    };
    const fakeTransformed = await DataTransformAdapter.transform<Fake, unknown>(
      Fake,
      fake,
    );
    const newFake = await sut.insertWithId<Fake>("fakes", fakeTransformed);
    const exists = await sut.exists("fakes", newFake.id!);
    expect(exists).toBeTruthy();
  });

  it("Testando o método update com DataTransform", async () => {
    const fake = {
      id: insertTransformTestId,
      name: "Jarilene dos Santos",
      birth: undefined,
    };
    const fakeTransformed = await DataTransformAdapter.transform<Fake, unknown>(
      Fake,
      fake,
    );
    await sut.update<Fake>("fakes", fakeTransformed);
    const fakes = await sut.getByValue<IFake>(
      "fakes",
      "name",
      "Jarilene dos Santos",
    );
    expect(
      fakes.length > 0 && fakes[0].name === "Jarilene dos Santos",
    ).toBeTruthy();
  });

  it("Testando o método updateField com DataTransform", async () => {
    const fakeChild = {
      id: "332211",
      name: "Enzo dos Santos",
    };
    const fakeChildTransformed = await DataTransformAdapter.transform<
      Fake,
      unknown
    >(Fake, fakeChild);
    await sut.updateField<Fake>(
      "fakes",
      insertTransformTestId,
      "child",
      fakeChildTransformed,
    );
    const fake = await sut.getById<Fake>("fakes", insertTransformTestId);
    expect(fake?.child?.id === "332211").toBeTruthy();
  });

  it("Testando o método getByValue retornando um documento com uma propriedade do tipo Date", async () => {
    const fakes = await sut.getByValue<Fake>("fakes", "name", "João Freitas");
    expect(
      fakes.length > 0 && typeof fakes[0].birth?.getMonth === "function",
    ).toBeTruthy();
  });

  it("Testando o método getByValueOrdered retornando um documento com uma propriedade do tipo Date", async () => {
    const fakes = await sut.getByValueOrdered<Fake>(
      "fakes",
      "name",
      "==",
      "João Freitas",
      "id",
    );
    const compare =
      fakes.length > 0 && typeof fakes[0].birth.getMonth === "function";
    expect(compare).toBeTruthy();
  });

  it("Testando o método getPaginatedCollection retornando um documento com uma propriedade do tipo Date", async () => {
    const queryParams = { name: "João Freitas" };

    const fakes = await sut.getPaginatedCollection<Fake, FakeFilter>(
      "fakes",
      queryParams,
      FakeFilter,
    );

    const compare =
      fakes.length > 0 && typeof fakes[0].birth.getMonth === "function";
    expect(compare).toBeTruthy();
  });

  it("Testando o método getCollection retornando um documento com uma propriedade do tipo Date", async () => {
    const response = await sut.getCollection<Fake>("fakes", undefined);

    const fake = response.find((i) => i.id === "4334");
    const compare = fake && typeof fake.birth.getMonth === "function";

    expect(compare).toBeTruthy();
  });

  it("Testando o método getPaginatedArray retornando um array com uma propriedade do tipo Date", async () => {
    const pageSize = 5;
    const pageNumber = 1;

    const arrayPaginated = await sut.getPaginatedArray<IFake, IFakeItem>(
      "fakes",
      "123456",
      "items",
      pageNumber,
      pageSize,
    );

    const compare =
      arrayPaginated.length > 0 &&
      typeof arrayPaginated[0].createAt?.getMonth === "function";

    expect(compare).toBeTruthy();
  });

  it("Testando o método insert retornando um array com uma propriedade do tipo Date", async () => {
    const fake: IFake = {
      name: "Jubileldo",
      age: 36,
      email: "jubi@3tecnos.com.br",
      items: [],
      birth: new Date(),
    };
    const newFake = await sut.insert<IFake>("fakes", fake);
    insertWithDateTestId = newFake.id!;

    const compare = newFake && typeof newFake.birth?.getMonth === "function";

    expect(compare).toBeTruthy();
  });

  it("Testando o método insertWithId retornando um array com uma propriedade do tipo Date", async () => {
    const fake: IFake = {
      id: "222",
      name: "Tiago",
      age: 67,
      email: "tiago@3tecnos.com.br",
      isDad: true,
      items: [],
      birth: new Date(),
    };
    const newFake = await sut.insertWithId<IFake>("fakes", fake);
    const compare = newFake && typeof newFake.birth?.getMonth === "function";

    expect(compare).toBeTruthy();
  });

  it("Testando o método getPaginatedCollection com filtros passados no whereCollection", async () => {
    const date = new Date(2000, 10, 10);
    const whereCollection: Where<Fake>[] = [
      { fieldPath: "birth", operator: "<", value: date },
    ];
    const orderByCollection: OrderBy<Fake>[] = [
      { fieldPath: "birth", direction: "asc" },
    ];
    const fakes = await sut.getPaginatedCollection<Fake, unknown>(
      "fakes",
      undefined,
      undefined,
      undefined,
      { whereCollection, orderByCollection },
    );

    const compare = await sut.getCollection<Fake>("fakes", {
      orderByCollection,
      whereCollection,
    });

    expect(fakes).toEqual(compare);
  });

  it("Testando o método remove", async () => {
    await sut.remove("fakes", insertTestId);
    await sut.remove("fakes", dynamicId);
    await sut.remove("fakes", insertTransformTestId);
    await sut.remove("fakes", insertWithDateTestId);
    await sut.remove("fakes", "123456");
    await sut.remove("fakes", "000000");
    await sut.remove("fakes", "111111");
    await sut.remove("fakes", "9876");
    await sut.remove("fakes", "4334");
    await sut.remove("fakes", "222");
    const [existsOne, existsSecond] = await Promise.all([
      sut.exists("fakes", dynamicId),
      sut.exists("fakes", "123456"),
    ]);
    expect(existsOne && existsSecond).toBeFalsy();
  });
});
