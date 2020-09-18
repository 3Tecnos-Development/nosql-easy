import dotenv from "dotenv";
import { DialectType } from "../../src/types/DialectType";
import { NoSqlEasyConfig } from "../../src/Config";
import { NoSqlEasy } from "../../src/index";

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
    const fakes = await noSqlEasy.getByValue<IFake>("fakes", "email", "jesus@3tecnos.com.br");
    expect(fakes.length > 0 && fakes[0].id === "123456").toBe(true);
  });

  it("Testando o método getByValueOrdered", async () => {
    const noSqlEasy = new NoSqlEasy();
    const fakes = await noSqlEasy.getByValueOrdered<IFake>("fakes", "age", ">=", 30, "age", "asc");
    const compare = fakes.length > 0 && fakes[0].age === 33 && fakes[1].age === 36;
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
    const fakes = await noSqlEasy.getByValue<IFake>("fakes", "isDad", true);
    expect(fakes.length > 0 && fakes[0].name === "Lindsay").toBe(true);
  });

  it("Testando o método updateField", async () => {
    const noSqlEasy = new NoSqlEasy();
    await noSqlEasy.updateField<IFake>("fakes", dynamicId, "email", "lindsay.3tecnos@gmail.com");
    const fakes = await noSqlEasy.getByValue<IFake>("fakes", "email", "lindsay.3tecnos@gmail.com");
    expect(fakes.length > 0 && fakes[0].name === "Lindsay").toBe(true);
  });

  it("Testando o método remove", async () => {
    const noSqlEasy = new NoSqlEasy();
    await noSqlEasy.remove("fakes", dynamicId);
    await noSqlEasy.remove("fakes", "123456");
    const [existsOne, existsSecond] = await Promise.all([
      noSqlEasy.exists("fakes", dynamicId),
      noSqlEasy.exists("fakes", "123456"),
    ]);
    expect(existsOne && existsSecond).toBe(false);
  });
});
