import { Buffer } from "buffer/";
export declare type SchemaMethod = {
    id: number;
    method: string;
    params: Array<{
        name: string;
        type: string;
    }>;
    type: string;
};
export declare type SchemaConstructor = {
    id: number;
    predicate: string;
    params: Array<{
        name: string;
        type: string;
    }>;
    type: string;
};
export declare type Constructor = {
    _: string;
    [key: string]: Constructor | Array<Constructor> | any | Array<any>;
};
export declare type SerializationOptions = {
    size: number;
};
export interface Schema {
    raw: any;
    getMethodById(id: number): SchemaMethod;
    getMethodByName(name: string): SchemaMethod;
    getConstructorById(id: number): SchemaConstructor;
    getConstructorByPredicate(predicate: string): SchemaConstructor;
}
export declare class JsonSchema implements Schema {
    raw: any;
    constructor(raw: any);
    index(): void;
    getMethodById(id: number): SchemaMethod;
    getMethodByName(name: string): SchemaMethod;
    getConstructorById(id: number): SchemaConstructor;
    getConstructorByPredicate(predicate: string): SchemaConstructor;
}
export declare class Serializer {
    schema: Schema;
    buffer: Buffer;
    offset: number;
    size: number;
    constructor(schema: Schema, options?: SerializationOptions);
    resizeIfNeeded(plusSize?: number): void;
    int(value: number): this;
    int128(value: Uint8Array): this;
    long(value: Uint8Array): this;
    int256(value: Uint8Array): this;
    int512(value: Uint8Array): this;
    double(value: number): this;
    bool(value: boolean): this;
    bytes(value: Uint8Array, length?: number): this;
    string(value: string): this;
    method(name: string, params?: any): this;
    object(constructor: Constructor): this;
    store(type: string, value: any): this;
    addPadd(): void;
    getBytes(): Uint8Array;
}
export declare class Deserializer {
    schema: Schema;
    buffer: Buffer;
    offset: number;
    constructor(schema: Schema, buffer: ArrayBuffer);
    bool(): boolean | Constructor;
    bytes(): Uint8Array;
    double(): number;
    int(): number;
    int128(): Uint8Array;
    int256(): Uint8Array;
    int512(): Uint8Array;
    long(): Uint8Array;
    string(): string;
    object(predicate?: string): Constructor;
    read(type?: string): string | number | boolean | Uint8Array | Constructor;
    slice(length: number): Buffer;
    skipPad(): void;
}
declare const _default: {
    Serializer: typeof Serializer;
    Deserializer: typeof Deserializer;
};
export default _default;
