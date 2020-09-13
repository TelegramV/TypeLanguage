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

import schema from "@telegramv/schema";
import {Buffer} from "buffer/";
import Packer from "../Packer";
import JsonSchema from "../JsonSchema";
import Unpacker from "../Unpacker";

function random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}

function randomBytes(size: number = 2048) {
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
        bytes[i] = random(0, 255);
    }
    return bytes;
}

const jsonSchema = new JsonSchema(schema);
const gzip = {compress: () => new Uint8Array, decompress: () => new Uint8Array};

const ns = () => new Packer(jsonSchema, gzip);
const nd = (data: Uint8Array) => new Unpacker(data, jsonSchema, gzip);

test("couple", () => {
    const testData = {
        int: 69,
        string: "Telegram V",
        long: new Uint8Array(8),
        bytes: randomBytes(4096),
        bool: false,
    };

    const s = ns();

    // @ts-ignore
    for (const [k, v] of Object.entries(testData)) {
        // @ts-ignore
        s[k](v);
    }

    const d = nd(s.toByteArray());

    // @ts-ignore
    for (const [k, v] of Object.entries(testData)) {
        if (v instanceof Uint8Array) {
            // @ts-ignore
            expect(Buffer.compare(d[k](), v))
                .toBe(0);
        } else {
            // @ts-ignore
            expect(d[k]())
                .toBe(v);
        }
    }
});

test("serialize inputFile", () => {
    const expectedBytes = Buffer.from([127, 242, 47, 245, 210, 4, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 3, 97, 97, 97, 3, 98, 98, 98]);
    const s = ns();

    s.type({
        _: "inputFile",
        id: new Uint8Array([210, 4, 0, 0, 0, 0, 0, 0]),
        parts: 2,
        name: "aaa",
        md5_checksum: "bbb",
    });

    expect(Buffer.compare(expectedBytes, Buffer.from(s.toByteArray())))
        .toBe(0);
});

test("int", () => {
    const intval = 69;
    const s = ns();
    s.int(intval);

    expect(s.toByteArray().length).toBe(4);

    expect(Buffer.from(s.toByteArray()).readUInt8(0)).toBe(intval);
});

test("string", () => {
    const strval = "durka";
    const s = ns();
    s.string(strval);

    const d = nd(s.toByteArray());

    expect(d.string()).toBe(strval);
});

test("bool", () => {
    const boolval = true;
    const s = ns();
    s.bool(boolval);

    expect(s.toByteArray().length).toBe(4);

    expect(Buffer.from(s.toByteArray()).readInt32LE(0)).toBe(-1720552011);
});

test("double", () => {
    const doubleval = 3.14;
    const s = ns();
    s.double(doubleval);

    expect(s.toByteArray().length).toBe(8);

    expect(Buffer.from(s.toByteArray()).readDoubleLE(0)).toBe(doubleval);
});