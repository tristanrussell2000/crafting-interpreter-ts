import { LoxClass } from "./LoxClass.js";
import { RuntimeError } from "./RuntimeError.js";
import Token from "./Token.js";

export class LoxInstance {
    #klass: LoxClass | undefined
    readonly #fields: Map<string, Object | null> = new Map();

    constructor(klass?: LoxClass) {
        this.#klass = klass;
    }

    setClass(klass: LoxClass) {
        this.#klass = klass;
    }

    get(name: Token): Object | null {
        if (this.#fields.has(name.lexeme)) {
            return this.#fields.get(name.lexeme)!;
        }

        const method = this.#klass?.findMethod(name.lexeme);
        if (method) {
            return method.bind(this);
        }

        throw new RuntimeError(name, `Undefined property '${name.lexeme}'.`);
    }

    set(name: Token, value: Object | null) {
        this.#fields.set(name.lexeme, value);
    }

    toString(): string {
        return this.#klass?.name + " instance";
    }
}