import {Schema, SchemaConstructor, SchemaMethod} from "./types";

class JsonSchema implements Schema {
    raw: any;

    constructor(raw: any) {
        this.raw = raw;

        if (!this.raw.indexes) {
            this.index();
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
            this.raw.indexes.constructors.predicates[predicate] = i;
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

    getConstructorByType(type: string): SchemaConstructor {
        return this.raw.constructors[this.raw.indexes.constructors.types[type]];
    }
}

export default JsonSchema;