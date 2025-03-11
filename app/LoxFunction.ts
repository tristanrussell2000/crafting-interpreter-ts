import { Environment } from "./Environment.js";
import { Interpreter } from "./Interpreter.js";
import { LoxCallable } from "./LoxCallable.js";
import { ReturnException } from "./ReturnException.js";
import { Stmt, Function as StmtFunction } from "./Stmt.js";

export class LoxFunction implements LoxCallable {
    readonly #declaration: StmtFunction;

    constructor(declaration: StmtFunction) {
        this.#declaration = declaration;
    }

    call(interpreter: Interpreter, args: Array<Object | null>): Object | null {
        const environment = new Environment(interpreter.globals);
        for (let i = 0; i < this.#declaration.params.length; i++) {
            environment.define(this.#declaration.params[i].lexeme, args[i]);
        }
        try {
            interpreter.executeBlock(this.#declaration.body, environment);
        } catch (error) {
            if (error instanceof ReturnException) {
                return error.value;
            }
            throw error;
        }
        return null;
    }

    arity(): number {
        return this.#declaration.params.length;
    }

    toString(): string {
        return `<fn ${this.#declaration.name.lexeme} >`;
    }
}
