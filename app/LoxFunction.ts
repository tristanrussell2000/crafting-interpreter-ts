import { Environment } from "./Environment.js";
import { Interpreter } from "./Interpreter.js";
import { LoxCallable } from "./LoxCallable.js";
import { LoxInstance } from "./LoxInstance.js";
import { ReturnException } from "./ReturnException.js";
import { Stmt, Function as StmtFunction } from "./Stmt.js";

export class LoxFunction implements LoxCallable {
    readonly #declaration: StmtFunction;
    readonly #closure: Environment;
    readonly #isInitializer: boolean;

    constructor(declaration: StmtFunction, closure: Environment, isInitializer: boolean) {
        this.#declaration = declaration;
        this.#closure = closure;
        this.#isInitializer = isInitializer;
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
                if (this.#isInitializer) return this.#closure.getAt(0, "this");
                return error.value;
            }
            throw error;
        }
        if (this.#isInitializer) return this.#closure.getAt(0, "this");
        return null;
    }

    bind(instance: LoxInstance) {
        const environment = new Environment(this.#closure);
        environment.define("this", instance);
        return new LoxFunction(this.#declaration, environment, this.#isInitializer);
    }

    arity(): number {
        return this.#declaration.params.length;
    }

    toString(): string {
        return `<fn ${this.#declaration.name.lexeme} >`;
    }
}
