import { Environment } from "./Environment.js";
import { FunctionExpr } from "./Expr.js";
import { Interpreter } from "./Interpreter.js";
import { LoxCallable } from "./LoxCallable.js";
import { ReturnException } from "./ReturnException.js";
import { Stmt, Function as StmtFunction } from "./Stmt.js";

export class LoxFunction implements LoxCallable {
    readonly #declaration: StmtFunction | FunctionExpr;
    readonly #closure: Environment;

    constructor(
        declaration: StmtFunction | FunctionExpr,
        closure: Environment
    ) {
        this.#declaration = declaration;
        this.#closure = closure;
    }

    call(interpreter: Interpreter, args: Array<Object | null>): Object | null {
        const environment = new Environment(this.#closure);
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
        if (this.#declaration instanceof StmtFunction)
            return `<fn ${this.#declaration.name.lexeme} >`;
        else return "<fn lambda>";
    }
}
