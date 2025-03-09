import {
    Assign,
    Binary,
    Expr,
    Grouping,
    Literal,
    Unary,
    Variable,
} from "./Expr.js";
import { Expression, Print, Stmt, Var } from "./Stmt.js";
import Token from "./Token.js";
import TokenType from "./TokenType.js";
import { parseError } from "./main.js";

export class Parser {
    readonly #tokens: Array<Token>;
    #current = 0;

    constructor(tokens: Array<Token>) {
        this.#tokens = tokens;
    }

    // Helpers
    #isAtEnd(): boolean {
        return this.#peek().type === TokenType.EOF;
    }

    #peek(): Token {
        return this.#tokens[this.#current];
    }

    #previous(): Token {
        return this.#tokens[this.#current - 1];
    }

    #advance(): Token {
        if (!this.#isAtEnd()) this.#current++;
        return this.#previous();
    }

    // Checks if next token is of passed type (just peeks, doesn't advance)
    #check(type: TokenType): boolean {
        if (this.#isAtEnd()) return false;
        return this.#peek().type === type;
    }

    // Advances if next token is one of passed types, otherwise returns false
    #match(...types: Array<TokenType>): boolean {
        for (const type of types) {
            if (this.#check(type)) {
                this.#advance();
                return true;
            }
        }
        return false;
    }

    static error(token: Token, message: string): ParseError {
        parseError(token, message);
        return new ParseError();
    }

    #consume(type: TokenType, message: string): Token {
        if (this.#check(type)) return this.#advance();

        throw Parser.error(this.#peek(), message);
    }

    #synchronize() {
        this.#advance();
        // discards tokens until statement boundary
        // though misses on semicolon boundaries in for loops...
        while (!this.#isAtEnd()) {
            if (this.#previous().type === TokenType.SEMICOLON) return;
            switch (this.#peek().type) {
                case TokenType.CLASS:
                case TokenType.FUN:
                case TokenType.VAR:
                case TokenType.FOR:
                case TokenType.IF:
                case TokenType.WHILE:
                case TokenType.PRINT:
                case TokenType.RETURN:
                    return;
            }
            this.#advance();
        }
    }

    // Parsing Grammar Functions
    // Each matches a same named operator, or one of higher precedence
    #declaration(): Stmt | null {
        try {
            if (this.#match(TokenType.VAR)) return this.#varDeclaration();
            return this.#statement();
        } catch (error) {
            this.#synchronize();
            return null;
        }
    }

    #varDeclaration(): Stmt {
        const name = this.#consume(
            TokenType.IDENTIFIER,
            "Expect variable name."
        );

        let initializer: Expr | null = null;
        if (this.#match(TokenType.EQUAL)) {
            initializer = this.#expression();
        }

        this.#consume(
            TokenType.SEMICOLON,
            "Expect ';' after variable declaration"
        );
        return new Var(name, initializer);
    }

    #statement(): Stmt {
        if (this.#match(TokenType.PRINT)) return this.#printStatement();
        return this.#expressionStatement();
    }

    #printStatement(): Stmt {
        const value = this.#expression();
        this.#consume(TokenType.SEMICOLON, "Expect ';' after value.");
        return new Print(value);
    }

    #expressionStatement(): Stmt {
        const expr = this.#expression();
        this.#consume(TokenType.SEMICOLON, "Expect ';' after expression.");
        return new Expression(expr);
    }

    #expression(): Expr {
        return this.#assignment();
    }

    #assignment(): Expr {
        const expr = this.#equality();

        if (this.#match(TokenType.EQUAL)) {
            const equals = this.#previous();
            const value = this.#assignment();

            if (expr instanceof Variable) {
                const name = expr.name;
                return new Assign(name, value);
            }

            throw Parser.error(equals, "Invalid assignment target.");
        }

        return expr;
    }

    #equality(): Expr {
        let expr = this.#comparison();

        while (this.#match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
            const operator = this.#previous();
            const right = this.#comparison();
            expr = new Binary(expr, operator, right);
        }
        return expr;
    }

    #comparison(): Expr {
        let expr = this.#term();

        while (
            this.#match(
                TokenType.GREATER,
                TokenType.GREATER_EQUAL,
                TokenType.LESS,
                TokenType.LESS_EQUAL
            )
        ) {
            const operator = this.#previous();
            const right = this.#term();
            expr = new Binary(expr, operator, right);
        }
        return expr;
    }

    #term(): Expr {
        let expr = this.#factor();

        while (this.#match(TokenType.MINUS, TokenType.PLUS)) {
            const operator = this.#previous();
            const right = this.#factor();
            expr = new Binary(expr, operator, right);
        }
        return expr;
    }

    #factor(): Expr {
        let expr = this.#unary();

        while (this.#match(TokenType.SLASH, TokenType.STAR)) {
            const operator = this.#previous();
            const right = this.#unary();
            expr = new Binary(expr, operator, right);
        }
        return expr;
    }

    #unary(): Expr {
        if (this.#match(TokenType.BANG, TokenType.MINUS)) {
            const operator = this.#previous();
            const right = this.#unary();
            return new Unary(operator, right);
        }
        return this.#primary();
    }

    #primary(): Expr {
        if (this.#match(TokenType.FALSE)) return new Literal(false);
        if (this.#match(TokenType.TRUE)) return new Literal(true);
        if (this.#match(TokenType.NIL)) return new Literal(null);

        if (this.#match(TokenType.NUMBER, TokenType.STRING)) {
            return new Literal(this.#previous().literal);
        }

        if (this.#match(TokenType.IDENTIFIER)) {
            return new Variable(this.#previous());
        }

        if (this.#match(TokenType.LEFT_PAREN)) {
            const expr = this.#expression();
            this.#consume(
                TokenType.RIGHT_PAREN,
                "Expect ')' after expression."
            );
            return new Grouping(expr);
        }

        throw Parser.error(this.#peek(), "Expect expression.");
    }

    parse(): Array<Stmt | null> {
        const statements: Array<Stmt | null> = [];
        while (!this.#isAtEnd()) {
            statements.push(this.#declaration());
        }
        return statements;
    }
}

class ParseError extends Error {}
