import {Buffer} from "buffer/";
import {Constructor, GZIP, Schema} from "./types";

class Packer {
    size: number = 2048;

    schema: Schema;
    gzip: GZIP;
    buffer: Buffer;

    offset: number;

    constructor(schema: Schema, gzip: GZIP) {
        this.schema = schema;
        this.gzip = gzip;

        this.buffer = new Buffer(this.size);
        this.offset = 0;
    }

    resizeIfNeeded(length: number = 1024) {
        const newSize = this.size + length;

        if (this.size < newSize) {
            const newBuffer = new Buffer(newSize + 1024);
            newBuffer.set(this.buffer, 0);
            this.buffer = newBuffer;
            this.size = newSize + 1024;
        }
    }

    write(buffer: Uint8Array, length?: number) {
        length = length || buffer.length;

        this.resizeIfNeeded(length);

        this.buffer.set(buffer.slice(0, length), this.offset);
        this.offset += length;

        return this;
    }

    int(value: number): this {
        this.resizeIfNeeded(4);

        this.buffer.writeInt32LE(value ?? 0, this.offset, true);
        this.offset += 4;

        return this;
    }

    uint(value: number): this {
        this.resizeIfNeeded(4);

        this.buffer.writeUInt32LE(value ?? 0, this.offset, true);
        this.offset += 4;

        return this;
    }

    id(value: number): this {
        return this.int(value);
    }

    bool(value: boolean): this {
        this.resizeIfNeeded(4);

        if (value) {
            this.id(0x997275b5);
        } else {
            this.id(0xbc799737);
        }

        return this;
    }

    long(value: Uint8Array): this {
        return this.write(value, 8);
    }

    double(value: number): this {
        this.resizeIfNeeded(8);

        this.buffer.writeDoubleLE(value, this.offset);
        this.offset += 8;

        return this;
    }

    bytes(buffer: Uint8Array): this {
        const length = buffer.length;

        this.resizeIfNeeded(length + 4);

        if (length <= 253) {
            this.buffer.writeUInt8(length, this.offset++);
        } else {
            this.buffer.writeUInt8(254, this.offset++);
            this.buffer.writeUInt8(length & 0xFF, this.offset++);
            this.buffer.writeUInt8((length & 0xFF00) >> 8, this.offset++);
            this.buffer.writeUInt8((length & 0xFF0000) >> 16, this.offset++);
        }

        this.buffer.set(buffer, this.offset);
        this.offset += length;

        while (this.offset % 4) {
            this.buffer.writeUInt8(0, this.offset++);
        }

        return this;
    }

    string(value: string): this {
        return this.bytes(new Buffer(value ?? ""));
    }

    type(constructor: Constructor): this {
        const schemaConstructor = this.schema.getConstructorByPredicate(constructor._);

        if (!schemaConstructor) {
            throw new Error(`No constructor found: ${constructor._}`);
        }

        this.id(schemaConstructor.id);
        this.params(constructor, schemaConstructor.params);

        return this;
    }

    method(name: string, params: any = {}): this {
        const method = this.schema.getMethodByName(name);

        if (!method) {
            throw new Error(`No method found: ${name}`);
        }

        this.id(method.id);
        this.params(params, method.params);

        return this;
    }

    params(params: any, schemaParams: Array<{ name: string; type: string; }>) {
        for (let i = 0; i < schemaParams.length; i++) {
            let {name, type} = schemaParams[i];

            if (type === "#") {
                const hashParams = schemaParams.filter(param => param.type.substr(0, name.length + 1) === `${name}.`);

                for (const param of hashParams) {
                    const [cond] = param.type.split("?");
                    const [field, bit] = cond.split(".") as [string, number];

                    if (!(params[field] & (1 << bit)) && params[param.name] != null && params[param.name] !== false) {
                        params[field] |= 1 << bit;
                    }
                }
            }

            if (type.indexOf("?") !== -1) {
                const [cond, condType] = type.split("?");
                const [field, bit] = cond.split(".") as [string, number];
                if (!(params[field] & (1 << bit))) {
                    continue;
                }
                type = condType;
            }

            this.pack(type, params[name]);
        }
    }

    pack(type: string, value: any) {
        switch (type) {
            case "int":
                return this.int(value);
            case "long":
                return this.long(value);
            case "int128":
                return this.write(value, 16);
            case "int256":
                return this.write(value, 32);
            case "int512":
                return this.write(value, 64);
            case "string":
                return this.string(value);
            case "bytes":
                return this.bytes(value);
            case "double":
                return this.double(value);
            case "bool":
                return this.bool(value);
            case "true":
                return this;
        }

        if (type.startsWith("vector") || type.startsWith("Vector")) {
            this.id(0x1cb5c415);

            const vectorType = type.substr(7, type.length - 8);

            if (Array.isArray(value)) {
                this.int(value.length);

                for (let i = 0; i < value.length; i++) {
                    this.pack(vectorType, value[i]);
                }
            }

            return this;
        }

        if (typeof value === "object") {
            return this.type(value);
        }

        throw new Error("Invalid input.");
    }

    toByteArray(): Uint8Array {
        const array = new Uint8Array(this.offset);

        array.set(this.buffer.slice(0, this.offset), 0);

        return array;
    }
}

export default Packer;