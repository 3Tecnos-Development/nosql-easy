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

## Database actually supported

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

| Function                 | Description                                                                                                                                                                                     | Param                                                                                                                             | Return            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `WhereFilterOp`          | Add a new document to this collection with the specified data, assigning it a document ID automatically                                                                                         | `collection: string, data: T `                                                                                                    | `Promise<T>`      |
| `insertWithId<T>`        | Add a new document to this collection with the specified data, assigning it a document ID automatically, inserting a custom id                                                                  | `collection: string, data: T `                                                                                                    | `Promise<T>`      |
| `insertElementInArray`   | Add a new document to this collection with the specified data, and update fields into document referred                                                                                         | `collection: string, id: string, arrayFieldName: string, Value: any`                                                              | `Promise`         |
| `getCollection`          | Get data collection that refers to the specified collection path.                                                                                                                               | `collection: string, options?: Options<T> `                                                                                       | `Promise<T[]>`    |
| `getById<T>`             | Get data from the collection by id.                                                                                                                                                             | `collection: string, id: string `                                                                                                 | `Promise<T>`      |
| `getByValue<T>`          | Get data collection filtered by value.                                                                                                                                                          | `collection: string, fieldPath: string, value: any, whereFilter?: WhereFilterOp `                                                 | `Promise<T[]>`    |
| `getByValueOrdered<T>`   | Get data collection ordinated and filtered by value.                                                                                                                                            | `collection: string, fieldPath: string, whereFilter: WhereFilterOp, value: any, fieldOrder: string, direction?: OrderByDirection` | `Promise<T[]>`    |
| `update<T>`              | Updates fields in the document referred to by this DocumentReference. Note. The document ID must exist in the data sent                                                                         | `collection: string, data: T`                                                                                                     | `Promise`         |
| `updateField<T>`         | Updates fields in the document referred to by this DocumentReference in a fieldPath.                                                                                                            | `collection: string, id: string, fieldName: keyof T, value: any`                                                                  | `Promise`         |
| `remove`                 | Deletes the document referred to by this DocumentReference.                                                                                                                                     | `collection: string, id: string`                                                                                                  | `Promise`         |
| `exists`                 | True if the document exists.                                                                                                                                                                    | `collection: string, id: string`                                                                                                  | `Promise`         |
| `getSizeCollection`      | Return the size of the collection.                                                                                                                                                              | `collection: string, options?: Options<T>`                                                                                        | `Promise<number>` |
| `getPaginatedCollection` | Get batch data collection that refers to the specified collection path. Note: The firestore requires indexes for queries with filters and sorting, if applicable, you will need to create them. | `collection: string, queryParams?: any, FilterClass?: new () => F, orderBy?: OrderBy<T>`                                          | `Promise<T[]>`    |

## Types

| Type               | Options                                                                   |
| ------------------ | ------------------------------------------------------------------------- |
| `WhereFilterOp`    | `<`, `<=`, `==`, `>=`, `">`, `array-contains`, `in`, `array-contains-any` |
| `OrderByDirection` | `desc`, `asc`                                                             |
