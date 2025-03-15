import { Environment } from "./Environment.js";
import { Interpreter } from "./Interpreter.js";
import { LoxCallable } from "./LoxCallable.js";
import { LoxInstance } from "./LoxInstance.js";
import { FunctionType } from "./Resolver.js";
import { ReturnException } from "./ReturnException.js";
import { Stmt, Function as StmtFunction } from "./Stmt.js";

export class LoxFunction implements LoxCallable {
    readonly #declaration: StmtFunction;
    readonly #closure: Environment;
    readonly #isInitializer: boolean;
    readonly #functionType: FunctionType;

    constructor(declaration: StmtFunction, closure: Environment, isInitializer: boolean, functionType: FunctionType) {
        this.#declaration = declaration;
        this.#closure = closure;
        this.#isInitializer = isInitializer;
        this.#functionType = functionType;
    }

    call(interpreter: Interpreter, args: Array<Object | null>): Object | null {
        const environment = new Environment(this.#closure);
        if (this.#declaration instanceof StmtFunction) {
            for (let i = 0; i < this.#declaration.params.length; i++) {
                environment.define(this.#declaration.params[i].lexeme, args[i]);
            }
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
        return new LoxFunction(this.#declaration, environment, this.#isInitializer, this.#functionType);
    }

    getFunctionType(): FunctionType {
        return this.#functionType;
    }

    arity(): number {
        return (this.#declaration instanceof StmtFunction) ? this.#declaration.params.length : 0;
    }

    toString(): string {
        return `<fn ${this.#declaration.name.lexeme} >`;
    }
}
