<h3 align="center">nosql-easy</h3>
<p align="center">This library aims to facilitate access to a non-relational database.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/nosql-easy">
    <img src="https://img.shields.io/npm/v/nosql-easy.svg" alt="NPM">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="MIT">
  </a>
</p>

## Installation

Install via NPM:

```bash
npm install nosql-easy

```

## Database currently supported

- Firebase - Firestore

## Usage

.env (file)

```
#Firebase
FIRESTORE_CREDENTIAL={"credential":{"projectId":"your_project","clientEmail":"your_email","privateKey":"your_privateKey"}, "databaseURL":"your_url"}

#AWS
AWS_CREDENTIAL={"accessKeyId":"your_accessKeyId","secretAccessKey":"your_secretAccessKey","region":"sa-east-1"}
```

#### TypeScript

```typescript
import { NoSqlEasy, NoSqlEasyConfig } from "nosql-easy";

NoSqlEasyConfig.setDialect("Firestore");

export class BaseService {
  public repository: NoSqlEasy;
  public collection: string;

  constructor(collection: string) {
    this.repository = new NoSqlEasy();
    this.collection = collection;
  }

  async insert(data: T): Promise<T> {
    return await this.repository.insert<T>(this.collection, data);
  }
}
```

### Functionality

| Function                              | Description                                                                                                                                                                                                                                                                     | Param                                                                                                                                                          | Return            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `WhereFilterOp`                       | Add a new document to this collection with the specified data, assigning it a document ID automatically                                                                                                                                                                         | `collection: string, data: T `                                                                                                                                 | `Promise<T>`      |
| `insert<T, R = T>`                    | Add a new document to this collection with the specified data, assigning it a document ID automatically. When the response class is informed, the return data will be transformed to it.                                                                                        | `collection: string, data: T, ResponseClass?: new () => R`                                                                                                     | `Promise<R>`      |
| `insertWithId<T, R = T>`              | Add a new document to this collection with the specified data, assigning it a document ID automatically, inserting a custom id. When the response class is informed, the return data will be transformed to it.                                                                 | `collection: string, data: T, ResponseClass?: new () => R `                                                                                                    | `Promise<R>`      |
| `insertElementInArray`                | Add a new document to this collection with the specified data, and update fields into document referred                                                                                                                                                                         | `collection: string, id: string, arrayFieldName: string, Value: any`                                                                                           | `Promise`         |
| `removeElementInArray`                | Get data from a collection by id and remove the specified element in an array field                                                                                                                                                                                             | `collection: string, id: string, arrayFieldName: string, Value: any`                                                                                           | `Promise`         |
| `getCollection<T, R = T>`             | Get data collection that refers to the specified collection path. When the response class is informed, the return data will be transformed to it.                                                                                                                               | `collection: string, options?: Options<T>, ResponseClass?: new () => R `                                                                                       | `Promise<R[]>`    |
| `getById<T, R = T>`                   | Get data from the collection by id.                                                                                                                                                                                                                                             | `collection: string, id: string, ResponseClass?: new () => R `                                                                                                 | `Promise<R>`      |
| `getByValue<T, R = T>`                | Get data collection filtered by value. When the response class is informed, the return data will be transformed to it.                                                                                                                                                          | `collection: string, fieldPath: string, value: any, whereFilter?: WhereFilterOp, ResponseClass?: new () => R `                                                 | `Promise<R[]>`    |
| `getByValueOrdered<T, R = T>`         | Get data collection ordinated and filtered by value. When the response class is informed, the return data will be transformed to it.                                                                                                                                            | `collection: string, fieldPath: string, whereFilter: WhereFilterOp, value: any, fieldOrder: string, direction?: OrderByDirection, ResponseClass?: new () => R` | `Promise<R[]>`    |
| `update<T>`                           | Updates fields in the document referred to by this DocumentReference. Note. The document ID must exist in the data sent                                                                                                                                                         | `collection: string, data: T`                                                                                                                                  | `Promise`         |
| `updateField<T, C = any>`             | Updates fields in the document referred to by this DocumentReference in a fieldPath or nestedFields.                                                                                                                                                                            | `collection: string, id: string, field: keyof T \| FieldNested<T, C>, value: any`                                                                              | `Promise`         |
| `remove`                              | Deletes the document referred to by this DocumentReference.                                                                                                                                                                                                                     | `collection: string, id: string`                                                                                                                               | `Promise`         |
| `exists`                              | True if the document exists.                                                                                                                                                                                                                                                    | `collection: string, id: string`                                                                                                                               | `Promise`         |
| `getSizeCollection`                   | Return the size of the collection.                                                                                                                                                                                                                                              | `collection: string, options?: Options<T>`                                                                                                                     | `Promise<number>` |
| `getPaginatedCollection<T, F, R = T>` | Get batch data collection that refers to the specified collection path. Note: The firestore requires indexes for queries with filters and sorting, if applicable, you will need to create them. When the response class is informed, the return data will be transformed to it. | `collection: string, queryParams?: any, FilterClass?: new () => F, minimumSizeToPaginated?: number, options?: Options<T>, ResponseClass?: new () => R`         | `Promise<R[]>`    |
| `getPaginatedArray<T, A, R = A>`      | Get the paginated array of a document that refers to the specified collection path.                                                                                                                                                                                             | `collection: string, id: string, field: keyof T, pageNumber: number, pageSize?: number, minimumSizeToPaginated?: number, ResponseClass?: new () => R`          | `Promise<R[]>`    |

## Types

| Type               | Options                                                                   |
| ------------------ | ------------------------------------------------------------------------- |
| `WhereFilterOp`    | `<`, `<=`, `==`, `>=`, `">`, `array-contains`, `in`, `array-contains-any` |
| `OrderByDirection` | `desc`, `asc`                                                             |
| `DialectType`      | `Firestore`, `Firebase`                                                   |
