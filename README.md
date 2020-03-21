# Type Language
Type Language serialization and deserialization for JavaScript.

## Installation
NPM:
```shell script
npm install @telegramv/tl
```

Yarn:
```shell script
yarn add @telegramv/tl
```

## Usage
Example:
```typescript
import {Serializer, Deserializer, JsonSchema} from "@telegramv/tl";
import schema from "@telegramv/tl/schema/current.json";

const jsonSchema = new JsonSchema(schema);

const serializer = new Serializer(jsonSchema)
    .int(69)
    .string("victory")
    .bytes(new Uint8Array([1, 2, 3, 4]), 4)
    .long(new Uint8Array(8));

console.log(serializer.buffer);

const deserializer = new Deserializer(jsonSchema, serializer.buffer);

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