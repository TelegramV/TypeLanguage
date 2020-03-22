import { SchemaConstructor, SchemaMethod } from "./index";
declare type JsonSchemaRaw = {
    constructors: Array<SchemaConstructor>;
    methods: Array<SchemaMethod>;
};
export declare function tl2json(tl: string): JsonSchemaRaw;
export declare function json2tl(json: JsonSchemaRaw): string;
export declare function tlConstructor2json(tlConstructor: string): SchemaConstructor;
export declare function tlMethod2json(tlConstructor: string): SchemaMethod;
export declare function jsonConstructor2tl(method: SchemaConstructor): string;
export declare function jsonMethod2tl(method: SchemaMethod): string;
export {};
