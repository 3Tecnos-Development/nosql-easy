/* eslint-disable import/no-extraneous-dependencies */
import "reflect-metadata";
import dotenv from "dotenv";
import { plainToClass } from "class-transformer";
import { NoSqlEasyConfig } from "../../Config";
import { DialectType } from "../../types/DialectType";
import { NoSqlEasy, OrderBy } from "../../index";
import { FakeFilter, FakeResponse } from "../entities";

dotenv.config();

jest.setTimeout(30000);

interface IFake {
  id?: string;
  name: string;
  age: number;
  email: string;
  isDad?: boolean;
}

NoSqlEasyConfig.setDialect(process.env.DB_DIALECT as DialectType);

let dynamicId: string;

describe("NoSqlEasy", () => {
  it("Testando o método insert", async () => {
    const fake: IFake = {
      name: "Lindsay",
      age: 36,
      email: "lindsay@3tecnos.com.br",
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

    const compare =
      fakes.length > 0 && fakes.length <= 1 && fakes[0].age === 36;
    expect(compare).toBe(true);
  });

  it("Testando o método update", async () => {
    const fakeDad: IFake = {
      id: dynamicId,
      name: "Lindsay",
      age: 36,
      email: "lindsay@3tecnos.com.br",
      isDad: true,
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
      id: "000000",
      name: "Moises",
      age: 42,
      email: "moirocar@gmail.com",
    };

    const noSqlEasy = new NoSqlEasy();

    const id = await noSqlEasy.insertWithId("fakes", fake, FakeResponse);

    const toCompare = plainToClass(
      FakeResponse,
      { id, ...fake },
      { excludeExtraneousValues: true },
    );

    expect(fake).toMatchObject(toCompare);
  });

  it("Testando o método insertWithId com o retorno customizado", async () => {
    const noSqlEasy = new NoSqlEasy();
    const fake: IFake = {
      id: "111111",
      name: "Jesus",
      age: 33,
      email: "jesus@3tecnos.com.br",
      isDad: true,
    };
    const id = await noSqlEasy.insertWithId("fakes", fake, FakeResponse);

    const toCompare = plainToClass(
      FakeResponse,
      { id, ...fake },
      { excludeExtraneousValues: true },
    );

    expect(fake).toMatchObject(toCompare);
  });

  it("Testando o método getCollection com o retorno customizado", async () => {
    const response = await new NoSqlEasy().getCollection<FakeResponse>("fakes");
    const toCompare = await new NoSqlEasy().getCollection<FakeResponse>(
      "fakes",
      undefined,
      FakeResponse,
    );

    expect(response).toMatchObject(toCompare);
  });

  it("Testando o método getPaginatedCollection com o retorno customizado", async () => {
    const response = await new NoSqlEasy().getPaginatedCollection("fakes", {
      limit: 5,
      page: 1,
    });

    const toCompare = await new NoSqlEasy().getPaginatedCollection(
      "fakes",
      {
        limit: 5,
        page: 1,
      },
      undefined,
      undefined,
      FakeResponse,
    );
    expect(response).toMatchObject(toCompare);
  });

  it("Testando o método getByValue com retorno customizado", async () => {
    const noSqlEasy = new NoSqlEasy();
    const fake = await noSqlEasy.getByValue<IFake>(
      "fakes",
      "email",
      "jesus@3tecnos.com.br",
    );

    const toCompare = await noSqlEasy.getByValue<IFake, FakeResponse>(
      "fakes",
      "email",
      "jesus@3tecnos.com.br",
      undefined,
      FakeResponse,
    );

    expect(fake).toMatchObject(toCompare);
  });

  it("Testando o método getByValueOrdered com retorno customizado", async () => {
    const noSqlEasy = new NoSqlEasy();
    const fake = await noSqlEasy.getByValueOrdered<IFake>(
      "fakes",
      "age",
      ">=",
      30,
      "age",
      "asc",
    );

    const toCompare = await noSqlEasy.getByValueOrdered<IFake, FakeResponse>(
      "fakes",
      "age",
      ">=",
      30,
      "age",
      "asc",
      FakeResponse,
    );

    expect(fake).toMatchObject(toCompare);
  });

  it("Testando o método remove", async () => {
    const noSqlEasy = new NoSqlEasy();
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
