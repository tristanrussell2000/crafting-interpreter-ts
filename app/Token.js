export default class Token {
    type;
    lexeme;
    literal;
    line;
    constructor(type, lexeme, literal, line) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.line = line;
    }
    toString() {
        return this.type + " " + this.lexeme + " " + this.literal;
    }
}
