interface ITransaction<T> {
  transaction: T;
}

export type Transaction<T = any> = ITransaction<T>;
