import TokenType from "./TokenType.js";

export default class Token {
    readonly type: TokenType;
    readonly lexeme: string;
    readonly literal: Object | null;
    readonly line: number;

    constructor(
        type: TokenType,
        lexeme: string,
        literal: Object | null,
        line: number
    ) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.line = line;
    }

    public toString(): string {
        return this.type + " " + this.lexeme + " " + this.literal;
    }
}
