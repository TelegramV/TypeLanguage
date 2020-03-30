# Type Language
[![npm version](https://badge.fury.io/js/%40telegramv%2Ftl.svg)](https://badge.fury.io/js/%40telegramv%2Ftl)

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

You also should install some library for GZIP manipulations. I recommend [`pako`](https://github.com/nodeca/pako).
```shell script
yarn add pako
```


## Usage
Example:
```typescript
import {Serializer, Deserializer, JsonSchema} from "@telegramv/tl";
import schema from "@telegramv/tl/schema/current.json";
import pako from "pako";

const jsonSchema = new JsonSchema(schema);

/**
 * Note: `data` is Uint8Array and method should return Uint8Array.

 * @property {(data: Uint8Array) => Uint8Array} gzip
 * @property {(data: Uint8Array) => Uint8Array} ungzip
 */
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

It is very convenient to use factory pattern here.

File `TLFactory.js`:
```javascript
import {Serializer, Deserializer, JsonSchema} from "@telegramv/tl";
import schema from "@telegramv/tl/schema/current.json";
import pako from "pako";

const jsonSchema = new JsonSchema(schema);
const gzip = {
    gzip: (data) => pako.gzip(data),
    ungzip: (data) => pako.ungzip(data),
};

const createSerializer = (options = {}) => new Serializer(jsonSchema, Object.assign({gzip}, options))
const createDeserializer = (buffer, options = {}) => new Deserializer(jsonSchema, buffer, Object.assign({gzip}, options))

const TLFactory = {
    serializer: createSerializer,
    deserializer: createDeserializer,
};

export default TLFactory;
```

File `example.js`:
```javascript
import TLFactory from "./TLFactory";

const serializer = TLFactory.serializer();
const deserializer = TLFactory.deserializer(serializer.getBytes().buffer);
```