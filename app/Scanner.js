import TokenType from "./TokenType.js";
import Token from './Token.js';
import { error } from "./main.js";
export default class Scanner {
    #source;
    #tokens = [];
    #start = 0;
    #current = 0;
    #line = 1;
    constructor(source) {
        this.#source = source;
    }
    #isAtEnd() {
        return this.#current >= this.#source.length;
    }
    #advance() {
        return this.#source[this.#current++];
    }
    #addToken(type, literal = null) {
        const text = this.#source.substring(this.#start, this.#current);
        this.#tokens.push(new Token(type, text, literal, this.#line));
    }
    #match(expected) {
        if (this.#isAtEnd())
            return false;
        if (this.#source.charAt(this.#current) != expected)
            return false;
        this.#current++;
        return true;
    }
    #peek() {
        if (this.#isAtEnd())
            return '\0';
        return this.#source.charAt(this.#current);
    }
    #string() {
        while (this.#peek() != '"' && !this.#isAtEnd()) {
            if (this.#peek() == '\n')
                this.#line++;
            this.#advance();
        }
        if (this.#isAtEnd()) {
            error(this.#line, "Unterminated string.");
            return;
        }
        this.#advance();
        // If lox supported escape sequences like \n, you'd unescape them here
        const value = this.#source.substring(this.#start + 1, this.#current - 1);
        this.#addToken(TokenType.STRING, value);
    }
    #isDigit(c) {
        const i = parseInt(c);
        if (isNaN(i))
            return false;
        return i >= 0 && i <= 9;
    }
    #peekNext() {
        if (this.#current + 1 >= this.#source.length)
            return '\0';
        return this.#source.charAt(this.#current + 1);
    }
    #number() {
        while (this.#isDigit(this.#peek()))
            this.#advance();
        if (this.#peek() === '.' && this.#isDigit(this.#peekNext())) {
            this.#advance();
            while (this.#isDigit(this.#peek()))
                this.#advance();
        }
        this.#addToken(TokenType.NUMBER, parseFloat(this.#source.substring(this.#start, this.#current)));
    }
    #scanToken() {
        const c = this.#advance();
        switch (c) {
            case '(':
                this.#addToken(TokenType.LEFT_PAREN);
                break;
            case ')':
                this.#addToken(TokenType.RIGHT_PAREN);
                break;
            case '{':
                this.#addToken(TokenType.LEFT_BRACE);
                break;
            case '}':
                this.#addToken(TokenType.RIGHT_BRACE);
                break;
            case ',':
                this.#addToken(TokenType.COMMA);
                break;
            case '.':
                this.#addToken(TokenType.DOT);
                break;
            case '-':
                this.#addToken(TokenType.MINUS);
                break;
            case '+':
                this.#addToken(TokenType.PLUS);
                break;
            case ';':
                this.#addToken(TokenType.SEMICOLON);
                break;
            case '*':
                this.#addToken(TokenType.STAR);
                break;
            case '!':
                this.#addToken(this.#match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
                break;
            case '=':
                this.#addToken(this.#match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
                break;
            case '<':
                this.#addToken(this.#match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
                break;
            case '>':
                this.#addToken(this.#match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
                break;
            case '/':
                if (this.#match('/')) {
                    while (this.#peek() != '\n' && !this.#isAtEnd())
                        this.#advance();
                }
                else {
                    this.#addToken(TokenType.SLASH);
                }
                break;
            case ' ':
            case '\r':
            case '\t': break;
            case '\n':
                this.#line++;
                break;
            case '"':
                this.#string();
                break;
            default:
                if (this.#isDigit(c)) {
                    this.#number();
                }
                else {
                    error(this.#line, "Unexpected character", c);
                    break;
                }
        }
    }
    scanTokens() {
        while (!this.#isAtEnd()) {
            this.#start = this.#current;
            this.#scanToken();
        }
        this.#tokens.push(new Token(TokenType.EOF, "", null, this.#line));
        return this.#tokens;
    }
}
