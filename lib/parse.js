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
Object.defineProperty(exports, "__esModule", { value: true });
function tl2json(tl) {
    return {
        constructors: [],
        methods: []
    };
}
exports.tl2json = tl2json;
function json2tl(json) {
    return "";
}
exports.json2tl = json2tl;
function tlConstructor2json(tlConstructor) {
    return {
        id: 0,
        predicate: "",
        params: [],
        type: ""
    };
}
exports.tlConstructor2json = tlConstructor2json;
function tlMethod2json(tlConstructor) {
    return {
        id: 0,
        method: "",
        params: [],
        type: ""
    };
}
exports.tlMethod2json = tlMethod2json;
function jsonConstructor2tl(method) {
    return "";
}
exports.jsonConstructor2tl = jsonConstructor2tl;
function jsonMethod2tl(method) {
    return "";
}
exports.jsonMethod2tl = jsonMethod2tl;
