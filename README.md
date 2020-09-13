# Type Language
[![npm version](https://badge.fury.io/js/protov-tl.svg)](https://badge.fury.io/js/%40telegramv%2Ftl)

TypeLanguage serialization and deserialization for JavaScript.

## Installation
NPM:
```shell script
npm install protov-tl
```

Yarn:
```shell script
yarn add protov-tl
```

You also should install some library for GZIP manipulations. I recommend [`pako`](https://github.com/nodeca/pako).
```shell script
yarn add pako
```

## Usage
Constructors:
```typescript
Packer(schema: Schema, gzip: GZIP);
Unpacker(data: Uint8Array, schema: Schema, gzip: GZIP);
```

Example:
```typescript
import {Packer, Unpacker, JsonSchema} from "@telegramv/tl";
import pako from "pako";

const jsonSchema = new JsonSchema(require("./schema.json"));

const gzip = {
    gzip: (data) => pako.gzip(data),
    ungzip: (data) => pako.ungzip(data),
};

const packer = new Packer(jsonSchema, gzip)
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

console.log(packer.toByteArray());

const deserializer = new Unpacker(packer.toByteArray(), jsonSchema, gzip);

const int = deserializer.int();
const string = deserializer.string();
const bytes = deserializer.bytes();
const long = deserializer.long();
const inputFile = deserializer.unpack();

console.log({
    int,
    string,
    bytes,
    long,
    inputFile,
})
```

It is very convenient to use factory pattern here.

File `TLFactory.js`:
```javascript
import {Packer, Unpacker, JsonSchema} from "@telegramv/tl";
import schema from "@telegramv/schema";
import pako from "pako";

const jsonSchema = new JsonSchema(schema);
const gzip = {
    gzip: (data) => pako.gzip(data),
    ungzip: (data) => pako.ungzip(data),
};

const createPacker = () => new Packer(jsonSchema, gzip)
const createUnpacker = (data) => new Unpacker(data, jsonSchema, gzip})

const TLFactory = {
    packer: createPacker,
    unpacker: createUnpacker,
};

export default TLFactory;
```

File `example.js`:
```javascript
import TLFactory from "./TLFactory";

const serializer = TLFactory.serializer();
const deserializer = TLFactory.deserializer(serializer.getBytes());
```