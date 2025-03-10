import { Interpreter } from "./Interpreter.js";

export interface LoxCallable {
    arity(): number;
    call(interpreter: Interpreter, args: Array<Object | null>): Object | null;
}

export function isLoxCallable(obj: any): obj is LoxCallable {
    return (
        obj &&
        obj.call &&
        typeof obj.call === "function" &&
        obj.arity &&
        typeof obj.arity === "function"
    );
}
