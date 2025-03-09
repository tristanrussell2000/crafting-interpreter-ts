import { RuntimeError } from "./RuntimeError.js";
import Token from "./Token.js";

export class Environment {
    readonly enclosing: Environment | null;
    readonly #values: Map<string, Object | null> = new Map();

    constructor(enclosing?: Environment) {
        if (enclosing) this.enclosing = enclosing;
        else this.enclosing = null;
    }

    define(name: string, value: Object | null) {
        this.#values.set(name, value);
    }

    get(name: Token): Object {
        const val = this.#values.get(name.lexeme);
        if (val) return val;
        if (this.enclosing !== null) return this.enclosing.get(name);

        throw new RuntimeError(
            name,
            "Undefined variable '" + name.lexeme + "'."
        );
    }

    assign(name: Token, value: Object | null) {
        if (this.#values.has(name.lexeme)) {
            this.#values.set(name.lexeme, value);
            return;
        }

        if (this.enclosing !== null) {
            this.enclosing.assign(name, value);
            return;
        }

        throw new RuntimeError(
            name,
            "Undefined variable '" + name.lexeme + "'."
        );
    }
}
