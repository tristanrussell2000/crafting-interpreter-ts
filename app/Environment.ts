import { RuntimeError } from "./RuntimeError.js";
import Token from "./Token.js";

export class Environment {
    readonly #values: Map<string, Object | null> = new Map();

    define(name: string, value: Object | null) {
        this.#values.set(name, value);
    }

    get(name: Token) {
        const val = this.#values.get(name.lexeme);
        if (val) return val;

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

        throw new RuntimeError(
            name,
            "Undefined variable '" + name.lexeme + "'."
        );
    }
}
