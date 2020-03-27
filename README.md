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
import pako from "pako";

const jsonSchema = new JsonSchema(schema);
const gzip = {
    gzip: (data) => pako.gzip(data),
    ungzip: (data) => pako.ungzip(data),
};

const serializer = new Serializer(jsonSchema, {gzip})
    .int(69)
    .string("victory")
    .bytes(new Uint8Array([1, 2, 3, 4]), 4)
    .long(new Uint8Array(8))
    .object({
        _: "inputFile",
        id: new Uint8Array([210, 4, 0, 0, 0, 0, 0, 0]),
        parts: 2,
        name: "xxx.png",
        md5_checksum: "ha.sh",
    });

console.log(serializer.getBytes());

const deserializer = new Deserializer(jsonSchema, serializer.getBytes().buffer, {gzip});

const int = deserializer.int();
const string = deserializer.string();
const bytes = deserializer.bytes();
const long = deserializer.long();
const inputFile = deserializer.object();

console.log({
    int,
    string,
    bytes,
    long,
    inputFile,
})
```