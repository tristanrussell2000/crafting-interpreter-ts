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

    get(name: Token): Object | null {
        const val = this.#values.get(name.lexeme);
        if (val !== undefined) return val;
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

    getAt(distance: number, name: string): Object | null {
        return this.ancestor(distance).#values.get(name) ?? null;
    }

    ancestor(distance: number): Environment {
        let environment: Environment | null = this;
        for (let i = 0; i < distance; i++) {
            environment = environment?.enclosing ?? null;
        }
        if (environment === null) throw new Error("Error resolving variable.");
        return environment;
    }

    assignAt(distance: number, name: Token, value: Object | null) {
        this.ancestor(distance).#values.set(name.lexeme, value);
    }
}
