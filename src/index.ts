/*
 * Telegram V
 * Copyright (C) 2020 Davyd Kohut
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Buffer} from "buffer/";

// --- types --- //

export type SchemaMethod = {
    id: number;
    method: string;
    params: Array<{ name: string; type: string; }>;
    type: string;
}

export type SchemaConstructor = {
    id: number;
    predicate: string;
    params: Array<{ name: string; type: string; }>;
    type: string;
}

export type Constructor = {
    _: string;
    [key: string]: Constructor | Array<Constructor> | any | Array<any>;
};

export type SerializationOptions = {
    size: number;
}

export interface Schema {
    raw: any;

    getMethodById(id: number): SchemaMethod;

    getMethodByName(name: string): SchemaMethod;

    getConstructorById(id: number): SchemaConstructor;

    getConstructorByPredicate(predicate: string): SchemaConstructor;
}

// --- implementation --- //

export class JsonSchema implements Schema {
    raw: any;

    constructor(raw: any) {
        this.raw = raw;

        if (!this.raw.indexes) {
            this.index()
        }
    }

    index() {
        this.raw.indexes = {
            constructors: {
                ids: {},
                types: {},
                predicates: {},
            },
            methods: {
                ids: {},
                names: {},
            },
        };

        for (let i = 0; i < this.raw.constructors.length; i++) {
            const {id, type, predicate} = this.raw.constructors[i];
            this.raw.indexes.constructors.ids[id] = i;
            this.raw.indexes.constructors.types[type] = i;
            this.raw.indexes.constructors.predicates[predicate] = i
        }

        for (let i = 0; i < this.raw.methods.length; i++) {
            const {id, method} = this.raw.methods[i];
            this.raw.indexes.methods.ids[id] = i;
            this.raw.indexes.methods.names[method] = i;
        }
    }

    getMethodById(id: number): SchemaMethod {
        return this.raw.methods[this.raw.indexes.methods.ids[id]];
    }

    getMethodByName(name: string): SchemaMethod {
        return this.raw.methods[this.raw.indexes.methods.names[name]];
    }

    getConstructorById(id: number): SchemaConstructor {
        return this.raw.constructors[this.raw.indexes.constructors.ids[id]];
    }

    getConstructorByPredicate(predicate: string): SchemaConstructor {
        return this.raw.constructors[this.raw.indexes.constructors.predicates[predicate]];
    }
}

export class Serializer {
    schema: Schema;

    buffer: Buffer;
    offset: number;

    size: number = 2048;

    constructor(schema: Schema, options?: SerializationOptions) {
        this.size = options?.size || 2048;

        this.buffer = new Buffer(this.size);
        this.schema = schema;

        this.offset = 0;
    }

    resizeIfNeeded(plusSize: number = 1024) {
        const newSize = this.size + plusSize;

        if (this.size < newSize) {
            const newBuffer = new Buffer(newSize + 1024);
            newBuffer.set(this.buffer, 0);
            this.buffer = newBuffer;
            this.size = newSize + 1024;
        }
    }

    int(value: number): this {
        this.resizeIfNeeded(4);

        this.buffer.writeInt32LE(value, this.offset);
        this.offset += 4;
        return this;
    }

    int128(value: Uint8Array): this {
        this.resizeIfNeeded(16);

        this.buffer.set(value.slice(0, 16), this.offset);
        this.offset += 16;
        return this;
    }

    long(value: Uint8Array): this {
        this.resizeIfNeeded(8);

        this.buffer.set(value.slice(0, 8), this.offset);
        this.offset += 8;
        return this;
    }

    int256(value: Uint8Array): this {
        this.resizeIfNeeded(32);

        this.buffer.set(value.slice(0, 32), this.offset);
        this.offset += 32;
        return this;
    }

    int512(value: Uint8Array): this {
        this.resizeIfNeeded(64);

        this.buffer.set(value.slice(0, 64), this.offset);
        this.offset += 64;
        return this;
    }

    double(value: number): this {
        this.resizeIfNeeded(8);

        this.buffer.writeDoubleLE(value, this.offset);
        this.offset += 8;
        return this;
    }

    bool(value: boolean): this {
        if (value) {
            this.int(0x997275b5);
        } else {
            this.int(0xbc799737);
        }

        return this;
    }

    bytes(value: Uint8Array, length?: number): this {
        length = length || value.byteLength || value.length;

        this.resizeIfNeeded(length);

        if (length <= 253) {
            this.buffer.writeUInt8(length, this.offset++);
        } else {
            this.buffer.writeUInt8(254, this.offset++);
            this.buffer.writeUInt8(length & 0xFF, this.offset++);
            this.buffer.writeUInt8((length & 0xFF00) >> 8, this.offset++);
            this.buffer.writeUInt8((length & 0xFF0000) >> 16, this.offset++);
        }

        this.buffer.set(value, this.offset);
        this.offset += length;

        return this;
    }

    string(value: string): this {
        const strBuffer = new Buffer(value);

        this.bytes(strBuffer);

        this.addPadd();

        return this;
    }

    method(name: string, params?: any): this {
        return this;
    }

    object(constructor: Constructor): this {
        const predicate = constructor._;
        const schemaConstructor = this.schema.getConstructorByPredicate(predicate);

        if (!schemaConstructor) {
            throw new Error("No predicate " + predicate + " found");
        }

        this.int(schemaConstructor.id);

        for (let i = 0; i < schemaConstructor.params.length; i++) {
            let {name, type} = schemaConstructor.params[i];

            this.store(type, constructor[name]);
        }

        return this;
    }

    store(type: string, value: any) {
        switch (type) {
            case "#":
            case "int":
                return this.int(value);
            case "long":
                return this.long(value);
            case "int128":
                return this.int128(value);
            case "int256":
                return this.int256(value);
            case "int512":
                return this.int512(value);
            case "string":
                return this.string(value);
            case "bytes":
                return this.bytes(value);
            case "double":
                return this.double(value);
            case "Bool" || "bool":
                return this.bool(value);
            case "true":
                return this;
        }

        if (typeof value === "object") {
            return this.object(value);
        }

        throw new Error("Invalid input.");
    }

    addPadd(): void {
        while (this.offset % 4) {
            this.buffer.writeUInt8(0, this.offset++);
        }
    }

    getBytes(): Uint8Array {
        const bytes = new Uint8Array(this.offset);
        bytes.set(this.buffer.slice(0, this.offset));
        return bytes;
    }
}

export class Deserializer {
    schema: Schema;

    buffer: Buffer;
    offset: number;

    constructor(schema: Schema, buffer: ArrayBuffer) {
        this.schema = schema;
        this.buffer = Buffer.from(buffer);
        this.offset = 0;
    }

    bool(): boolean | Constructor {
        const int = this.int();

        if (int === 0x997275b5) {
            return true;
        } else if (int === 0xbc799737) {
            return false;
        }

        this.offset -= 4;

        return this.object();
    }

    bytes(): Uint8Array {
        let length = this.buffer.readUInt8(this.offset++);

        if (length === 254) {
            length = this.buffer.readUInt8(this.offset++) |
                (this.buffer.readUInt8(this.offset++) << 8) |
                (this.buffer.readUInt8(this.offset++) << 16);
        }

        let bytes = this.buffer.slice(this.offset, this.offset + length);

        this.offset += length;

        this.skipPad();

        return bytes;
    }

    double(): number {
        const double = this.buffer.readDoubleLE(this.offset);
        this.offset += 8;
        return double;
    }

    int(): number {
        const int = this.buffer.readInt32LE(this.offset);
        this.offset += 4;
        return int;
    }

    int128(): Uint8Array {
        return this.slice(16);
    }

    int256(): Uint8Array {
        return this.slice(32);
    }

    int512(): Uint8Array {
        return this.slice(64);
    }

    long(): Uint8Array {
        return this.slice(8);
    }

    string(): string {
        return this.bytes().toString();
    }

    object(predicate?: string): Constructor {
        let schemaConstructor: SchemaConstructor;

        if (predicate) {
            schemaConstructor = this.schema.getConstructorByPredicate(predicate);

            if (!schemaConstructor) {
                throw new Error("Constructor not found: " + predicate);
            }
        } else {
            const int = this.int();

            // @ts-ignore
            predicate = int;

            schemaConstructor = this.schema.getConstructorById(int);
        }

        if (!schemaConstructor) {
            throw new Error("Constructor not found: " + predicate)
        }

        predicate = schemaConstructor.predicate;

        const result: Constructor = {
            _: predicate
        };

        for (let i = 0; i < schemaConstructor.params.length; i++) {
            let {name, type} = schemaConstructor.params[i];

            result[name] = this.read(type);
        }

        return result;
    }

    read(type?: string) {
        switch (type) {
            case "#":
            case "int":
                return this.int();
            case "long":
                return this.long();
            case "double":
                return this.double();
            case "int128":
                return this.int128();
            case "int256":
                return this.int256();
            case "int512":
                return this.int512();
            case "string":
                return this.string();
            case "bytes":
                return this.bytes();
            case "Bool" || "bool":
                return this.bool();
            case "true":
                return true
        }

        return this.object(type);
    }

    slice(length: number): Buffer {
        return this.buffer.slice(this.offset, this.offset += length);
    }

    skipPad() {
        while (this.offset % 4) {
            this.offset++
        }
    }
}

export default {Serializer, Deserializer};