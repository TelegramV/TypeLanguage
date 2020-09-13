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

export type GZIP = {
    compress: (data: Uint8Array) => Uint8Array;
    decompress: (data: Uint8Array) => Uint8Array;
};

export interface Schema {
    getMethodById(id: number): SchemaMethod;

    getMethodByName(name: string): SchemaMethod;

    getConstructorById(id: number): SchemaConstructor;

    getConstructorByType(type: string): SchemaConstructor;

    getConstructorByPredicate(predicate: string): SchemaConstructor;
}