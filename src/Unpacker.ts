import {Constructor, GZIP, Schema, SchemaConstructor} from "./types";

function isGzippedId(id: number): boolean {
    return id === 0x3072cfa1;
}

function isVectorId(id: number): boolean {
    return id === 0x1cb5c415;
}

function isBasic(type: string): boolean {
    return ["int", "bool", "string", "double", "long", "bytes", "true", "int128", "int256", "int512"].includes(type);
}

class Unpacker {
    buffer: Buffer;
    schema: Schema;
    gzip: GZIP;

    offset: number;

    constructor(buffer: Uint8Array | ArrayBuffer, schema: Schema, gzip: GZIP) {
        this.buffer = Buffer.from(buffer);
        this.schema = schema;
        this.gzip = gzip;

        this.offset = 0;
    }

    read(length: number): Uint8Array {
        const value = this.buffer.slice(this.offset, this.offset + length);
        this.offset += length;

        return value;
    }

    int(): number {
        const value = this.buffer.readInt32LE(this.offset);
        this.offset += 4;

        return value;
    }

    uint(): number {
        const value = this.buffer.readUInt32LE(this.offset);
        this.offset += 4;

        return value;
    }

    bool(): boolean | null {
        const id = this.int();

        if (id === -1720552011) {
            return true;
        } else if (id === -1132882121) {
            return false;
        } else {
            return null; // todo: handle it
        }
    }

    long(): Uint8Array {
        return this.read(8);
    }

    double(): number {
        const value = this.buffer.readDoubleLE(this.offset);
        this.offset += 8;

        return value;
    }

    bytes(): Uint8Array {
        let length = this.buffer.readUInt8(this.offset++);

        if (length >= 254) {
            length = this.buffer.readUInt8(this.offset++) |
                (this.buffer.readUInt8(this.offset++) << 8) |
                (this.buffer.readUInt8(this.offset++) << 16);
        }

        const bytes = this.read(length);

        while (this.offset % 4) {
            this.offset++;
        }

        return bytes;
    }

    string(): string {
        return this.bytes().toString();
    }

    unpackConstructor(schemaConstructor: SchemaConstructor): any | Constructor {
        switch (schemaConstructor.predicate) {
            case "boolFalse":
                return false;
            case "boolTrue" || "true":
                return true;
            case "null":
                return null;
        }

        const result: Constructor = {
            _: schemaConstructor.predicate
        };

        for (let i = 0; i < schemaConstructor.params.length; i++) {
            let {name, type} = schemaConstructor.params[i];

            if (type.indexOf("?") > -1) {
                const [cond, condType] = type.split("?");
                const [field, bit] = cond.split(".") as [string, number]; // ["field", 0]

                if (!(result[field] & (1 << bit))) {
                    continue;
                }

                result[name] = this.unpack(condType);
            } else {
                result[name] = this.unpack(type);
            }
        }

        return result;
    }

    vector(vectorType?: string) {
        const vectorSize = this.int();

        const result = new Array(vectorSize);

        if (vectorSize > 0) {
            if (vectorType && vectorType.charCodeAt(0) >= 97 && vectorType.charCodeAt(0) <= 122 && !isBasic(vectorType)) {
                const schemaConstructor = this.schema.getConstructorByPredicate(vectorType);

                if (!schemaConstructor) {
                    throw new Error(`unpacking vector no schemaConstructor found: ${vectorType}`);
                }

                for (let i = 0; i < vectorSize; i++) {
                    result[i] = this.unpackConstructor(schemaConstructor);
                }
            } else {
                for (let i = 0; i < vectorSize; i++) {
                    result[i] = this.unpack(vectorType);
                }
            }
        }

        return result;
    }

    unpack(type?: string): any {
        if (!type) {
            const id = this.int();

            if (isGzippedId(id)) {
                return new Unpacker(
                    this.gzip.decompress(this.bytes()),
                    this.schema,
                    this.gzip,
                ).unpack();
            }

            if (isVectorId(id)) {
                return this.vector();
            }

            return this.unpackConstructor(this.schema.getConstructorById(id));
        }

        switch (type) {
            case "#":
                return this.int();
            case "int":
                return this.int();
            case "long":
                return this.long();
            case "double":
                return this.double();
            case "int128":
                return this.read(16);
            case "int256":
                return this.read(32);
            case "int512":
                return this.read(64);
            case "string":
                return this.string();
            case "bytes":
                return this.bytes();
            case "bool":
                return this.bool();
            case "true":
                return true;
            case "boolFalse":
                return false;
        }

        if (type.startsWith("vector") || type.startsWith("Vector")) {
            if (type.charAt(0) === "V") {
                const id = this.int();

                if (id !== 0x1cb5c415) {
                    throw new Error(`invalid vector id`);
                }
            }

            return this.vector(type.substr(7, type.length - 8));
        }

        if (type.charAt(0) === "%") {
            const constructor = this.schema.getConstructorByType(type.substr(1));

            if (!constructor) {
                throw new Error("Constructor not found for type: " + type);
            }

            return this.unpackConstructor(constructor);
        }

        return this.unpack();
    }
}

export default Unpacker;