import Token from "./Token.js";

export class RuntimeError extends Error {
    readonly token: Token;

    constructor(token: Token, message: string) {
        super(message);
        Object.setPrototypeOf(this, RuntimeError.prototype);
        this.token = token;
    }
}
