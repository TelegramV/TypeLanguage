# Type Language
Type Language serialization and deserialization for JavaScript.

## Installation
NPM:
```shell script
npm install typelanguage
```

Yarn:
```shell script
yarn add typelanguage
```

## Usage
Example:
```typescript
import {Serializer, Deserializer} from "typelanguage";
import schema from "typelanguage/schema/current.json";

const serializer = new Serializer(schema)
    .int(69)
    .string("victory")
    .bytes(new Uint8Array([1, 2, 3, 4]), 4)
    .long(new Uint8Array(8));

console.log(serializer.buffer);

const deserializer = new Deserializer(schema, serializer.buffer);

const int = deserializer.int();
const string = deserializer.string();
const bytes = deserializer.bytes();
const long = deserializer.long();

console.log({
    int,
    string,
    bytes,
    long,
})
```