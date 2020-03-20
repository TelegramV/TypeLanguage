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

import {Buffer} from "buffer";

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

export interface Schema {
    raw: any;

    getMethodById(id: number): SchemaMethod;

    getMethodByName(name: string): SchemaMethod;

    getConstructorById(id: number): SchemaConstructor;

    getConstructorByPredicate(predicate: string): SchemaConstructor;
}

// --- implementation --- //

export class Serializer {
    schema: Schema;

    buffer: Buffer;
    offset: number;

    constructor(schema: Schema) {
        this.buffer = new Buffer(2048);
        this.offset = 0;
        this.schema = schema;
    }

    int(value: number): this {
        this.buffer.writeInt32LE(value, this.offset);
        this.offset += 4;
        return this;
    }

    int128(value: Uint8Array): this {
        this.offset += 16;
        return this;
    }

    int256(value: Uint8Array): this {
        this.offset += 32;
        return this;
    }

    int512(value: Uint8Array): this {
        this.offset += 64;
        return this;
    }

    double(value: number): this {
        this.buffer.writeDoubleLE(value, this.offset);
        this.offset += 8;
        return this;
    }

    long(value: Uint8Array): this {
        this.buffer.set(value.slice(0, 8), this.offset);
        this.offset += 8;
        return this;
    }

    bool(value: boolean): this {
        if (value) {
            this.int(0x997275b5)
        } else {
            this.int(0xbc799737)
        }

        return this;
    }

    bytes(value: Uint8Array, length?: number): this {
        length = length || value.byteLength || value.length;

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

    addPadd() {
        while (this.offset % 4) {
            this.buffer.writeUInt8(0, this.offset++);
        }
    }
}

export class Deserializer {
    schema: Schema;

    buffer: Buffer;
    offset: number;

    constructor(schema: Schema, buffer: Buffer) {
        this.schema = schema;
        this.buffer = buffer;
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
        this.offset += 16;
        return new Uint8Array(16);
    }

    int256(): Uint8Array {
        this.offset += 32;
        return new Uint8Array(32);
    }

    int512(): Uint8Array {
        this.offset += 32;
        return new Uint8Array(32);
    }

    long(): Uint8Array {
        return this.slice(8);
    }

    string(): string {
        return this.bytes().toString();
    }

    object(predicate?: string): Constructor {
        let schemaConstructor: SchemaConstructor;

        if (predicate && predicate.charCodeAt(0) >= 97 && predicate.charCodeAt(0) <= 122) {
            schemaConstructor = this.schema.getConstructorByPredicate(predicate);

            if (!schemaConstructor) {
                throw new Error("Constructor not found for predicate: " + predicate);
            }
        } else {
            const int = this.int();

            if (!predicate) {
                // @ts-ignore
                predicate = int;
            }

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
            case "double":
                return this.double();
            case "Bool" || "bool":
                return this.bool();
            case "true":
                return true
        }

        return this.object(type);
    }

    slice(length: number): Uint8Array {
        return new Uint8Array(this.buffer.slice(this.offset, this.offset += length));
    }

    skipPad() {
        while (this.offset % 4) {
            this.offset++
        }
    }
}

export default {Serializer, Deserializer};