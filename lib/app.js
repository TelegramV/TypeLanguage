"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const current_json_1 = __importDefault(require("./schema/current.json"));
const jsonSchema = new index_1.JsonSchema(current_json_1.default);
const x = new Uint8Array([127, 242, 47, 245, 210, 4, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 3, 97, 97, 97, 3, 98, 98, 98]);
const s = new index_1.Serializer(jsonSchema);
console.log(s.object({
    _: "inputFile",
    id: new Uint8Array([210, 4, 0, 0, 0, 0, 0, 0]),
    parts: 2,
    name: "aaa",
    md5_checksum: "bbb",
}).getBytes());
console.log(x);
