import TokenType from "./TokenType.js";
import Token from "./Token.js";
import { error } from "./main.js";

export default class Scanner {
    readonly #source: string;
    readonly #tokens: Array<Token> = [];
    #start = 0;
    #current = 0;
    #line = 1;

    static keywords: Map<string, TokenType> = new Map<string, TokenType>();
    static {
        this.keywords.set("and", TokenType.AND);
        this.keywords.set("class", TokenType.CLASS);
        this.keywords.set("else", TokenType.ELSE);
        this.keywords.set("false", TokenType.FALSE);
        this.keywords.set("for", TokenType.FOR);
        this.keywords.set("fun", TokenType.FUN);
        this.keywords.set("if", TokenType.IF);
        this.keywords.set("nil", TokenType.OR);
        this.keywords.set("or", TokenType.OR);
        this.keywords.set("print", TokenType.PRINT);
        this.keywords.set("return", TokenType.RETURN);
        this.keywords.set("super", TokenType.SUPER);
        this.keywords.set("this", TokenType.THIS);
        this.keywords.set("true", TokenType.TRUE);
        this.keywords.set("var", TokenType.VAR);
        this.keywords.set("while", TokenType.WHILE);
    }

    constructor(source: string) {
        this.#source = source;
    }

    #isAtEnd(): boolean {
        return this.#current >= this.#source.length;
    }

    #advance(): string {
        return this.#source[this.#current++];
    }

    #addToken(type: TokenType, literal: Object | null = null) {
        const text = this.#source.substring(this.#start, this.#current);
        this.#tokens.push(new Token(type, text, literal, this.#line));
    }

    #match(expected: string): boolean {
        if (this.#isAtEnd()) return false;
        if (this.#source.charAt(this.#current) != expected) return false;
        this.#current++;
        return true;
    }

    #peek(): string {
        if (this.#isAtEnd()) return "\0";
        return this.#source.charAt(this.#current);
    }

    #string() {
        while (this.#peek() != '"' && !this.#isAtEnd()) {
            if (this.#peek() == "\n") this.#line++;
            this.#advance();
        }

        if (this.#isAtEnd()) {
            error(this.#line, "Unterminated string.");
            return;
        }

        this.#advance();

        // If lox supported escape sequences like \n, you'd unescape them here
        const value = this.#source.substring(
            this.#start + 1,
            this.#current - 1
        );
        this.#addToken(TokenType.STRING, value);
    }

    #isDigit(c: string): boolean {
        const i = parseInt(c);
        if (isNaN(i)) return false;
        return i >= 0 && i <= 9;
    }

    #peekNext(): string {
        if (this.#current + 1 >= this.#source.length) return "\0";
        return this.#source.charAt(this.#current + 1);
    }

    #number() {
        while (this.#isDigit(this.#peek())) this.#advance();

        if (this.#peek() === "." && this.#isDigit(this.#peekNext())) {
            this.#advance();
            while (this.#isDigit(this.#peek())) this.#advance();
        }

        this.#addToken(
            TokenType.NUMBER,
            parseFloat(this.#source.substring(this.#start, this.#current))
        );
    }

    #identifier() {
        while (this.#isAlphaNumeric(this.#peek())) this.#advance();

        const text = this.#source.substring(this.#start, this.#current);
        let type = Scanner.keywords.get(text);
        if (type == undefined) type = TokenType.IDENTIFIER;
        this.#addToken(type);
    }

    #isAlpha(c: string): boolean {
        return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
    }

    #isAlphaNumeric(c: string): boolean {
        return this.#isAlpha(c) || this.#isDigit(c);
    }

    #scanToken() {
        const c: string = this.#advance();
        switch (c) {
            case "(":
                this.#addToken(TokenType.LEFT_PAREN);
                break;
            case ")":
                this.#addToken(TokenType.RIGHT_PAREN);
                break;
            case "{":
                this.#addToken(TokenType.LEFT_BRACE);
                break;
            case "}":
                this.#addToken(TokenType.RIGHT_BRACE);
                break;
            case ",":
                this.#addToken(TokenType.COMMA);
                break;
            case ".":
                this.#addToken(TokenType.DOT);
                break;
            case "-":
                this.#addToken(TokenType.MINUS);
                break;
            case "+":
                this.#addToken(TokenType.PLUS);
                break;
            case ";":
                this.#addToken(TokenType.SEMICOLON);
                break;
            case "*":
                this.#addToken(TokenType.STAR);
                break;
            case "?":
                this.#addToken(TokenType.QUESTION);
                break;
            case ":":
                this.#addToken(TokenType.COLON);
                break;
            case "!":
                this.#addToken(
                    this.#match("=") ? TokenType.BANG_EQUAL : TokenType.BANG
                );
                break;
            case "=":
                this.#addToken(
                    this.#match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL
                );
                break;
            case "<":
                this.#addToken(
                    this.#match("=") ? TokenType.LESS_EQUAL : TokenType.LESS
                );
                break;
            case ">":
                this.#addToken(
                    this.#match("=")
                        ? TokenType.GREATER_EQUAL
                        : TokenType.GREATER
                );
                break;
            case "/":
                if (this.#match("/")) {
                    while (this.#peek() != "\n" && !this.#isAtEnd())
                        this.#advance();
                } else {
                    this.#addToken(TokenType.SLASH);
                }
                break;
            case " ":
            case "\r":
            case "\t":
                break;
            case "\n":
                this.#line++;
                break;
            case '"':
                this.#string();
                break;
            default:
                if (this.#isDigit(c)) {
                    this.#number();
                } else if (this.#isAlpha(c)) {
                    this.#identifier();
                } else {
                    error(this.#line, "Unexpected character", c);
                    break;
                }
        }
    }

    scanTokens(): Array<Token> {
        while (!this.#isAtEnd()) {
            this.#start = this.#current;
            this.#scanToken();
        }

        this.#tokens.push(new Token(TokenType.EOF, "", null, this.#line));
        return this.#tokens;
    }
}
