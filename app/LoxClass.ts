import { Interpreter } from "./Interpreter.js";
import { LoxCallable } from "./LoxCallable.js";
import { LoxFunction } from "./LoxFunction.js";
import { LoxInstance } from "./LoxInstance.js";

export class LoxClass implements LoxCallable {
    readonly name: string;
    readonly #methods: Map<string, LoxFunction>
    readonly superclass: LoxClass | null;

    constructor(name: string, superclass: LoxClass | null, methods: Map<string, LoxFunction>) {
        this.name = name;
        this.#methods = methods;
        this.superclass = superclass;
    }

    call(interpreter: Interpreter, args: Array<Object | null>): Object | null {
        const instance = new LoxInstance(this);
        const initializer = this.findMethod("init");
        if (initializer !== null) {
            initializer.bind(instance).call(interpreter, args);
        }

        return instance;
    }

    findMethod(name: string): LoxFunction | null {
        if (this.#methods.has(name)) {
            return this.#methods.get(name) ?? null;
        }

        if (this.superclass !== null) {
            return this.superclass.findMethod(name);
        }

        return null;
    }

    arity(): number {
        const initializer = this.findMethod("init");
        if (initializer === null) return 0;
        return initializer.arity();
    }

    toString() {
        return this.name;
    }
}