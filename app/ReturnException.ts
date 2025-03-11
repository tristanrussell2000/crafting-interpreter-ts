export class ReturnException extends Error {
    readonly value: Object | null;

    constructor(value: Object | null) {
        super();
        Object.setPrototypeOf(this, ReturnException.prototype);
        this.value = value;
    }
}
