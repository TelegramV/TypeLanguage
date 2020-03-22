/*
 * Telegram V
 * Copyright (C) 2020 Telegram V
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

import {SchemaConstructor, SchemaMethod} from "./index";

type JsonSchemaRaw = {
    constructors: Array<SchemaConstructor>,
    methods: Array<SchemaMethod>,
};

export function tl2json(tl: string): JsonSchemaRaw {
    return {
        constructors: [],
        methods: []
    };
}

export function json2tl(json: JsonSchemaRaw): string {
    return "";
}

export function tlConstructor2json(tlConstructor: string): SchemaConstructor {
    return {
        id: 0,
        predicate: "",
        params: [],
        type: ""
    };
}

export function tlMethod2json(tlConstructor: string): SchemaMethod {
    return {
        id: 0,
        method: "",
        params: [],
        type: ""
    };
}

export function jsonConstructor2tl(method: SchemaConstructor): string {
    return "";
}

export function jsonMethod2tl(method: SchemaMethod): string {
    return "";
}
