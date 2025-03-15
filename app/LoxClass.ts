import { Interpreter } from "./Interpreter.js";
import { LoxCallable } from "./LoxCallable.js";
import { LoxFunction } from "./LoxFunction.js";
import { LoxInstance } from "./LoxInstance.js";
import { FunctionType } from "./Resolver.js";
import { RuntimeError } from "./RuntimeError.js";
import Token from "./Token.js";

export class LoxClass extends LoxInstance implements LoxCallable {
    readonly name: string;
    readonly #methods: Map<string, LoxFunction>

    constructor(name: string, methods: Map<string, LoxFunction>) {
        super();
        this.setClass(this);
        this.name = name;
        this.#methods = methods;
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
        return this.#methods.get(name) ?? null;
    }

    arity(): number {
        const initializer = this.findMethod("init");
        if (initializer === null) return 0;
        return initializer.arity();
    }

    toString() {
        return this.name;
    }

    get(name: Token): Object | null {
        const method = this.#methods.get(name.lexeme);
        if (!method) throw new RuntimeError(name, `Undefined static method '${name.lexeme}'.`);

        if (!(method.getFunctionType() === FunctionType.STATIC)) throw new RuntimeError(name, `Specified method ${name.lexeme} is not static.`);

        return method;
    }
}