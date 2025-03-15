import {
    Assign,
    Binary,
    Call,
    Expr,
    Get,
    Set as ExprSet,
    Grouping,
    Literal,
    Logical,
    Unary,
    Variable,
    This,
} from "./Expr.js";
import {
    Block,
    Expression,
    If,
    Print,
    Stmt,
    Var,
    While,
    Function as StmtFunction,
    Return,
    Class,
} from "./Stmt.js";
import Token from "./Token.js";
import TokenType from "./TokenType.js";
import { error, parseError } from "./main.js";

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
            if (this.#match(TokenType.CLASS)) return this.#classDeclaration();
            if (this.#match(TokenType.FUN)) return this.#function();
            if (this.#match(TokenType.VAR)) return this.#varDeclaration();
            return this.#statement();
        } catch (error) {
            this.#synchronize();
            return null;
        }
    }

    #classDeclaration(): Stmt {
        const name = this.#consume(TokenType.IDENTIFIER, "Expect class name.");
        this.#consume(TokenType.LEFT_BRACE, "Expect '{' before class body.");

        const methods: Array<StmtFunction> = [];
        while (!this.#check(TokenType.RIGHT_BRACE) && !this.#isAtEnd()) {
            methods.push(this.#method())
        }

        this.#consume(TokenType.RIGHT_BRACE, "Expect '}' after class body.");

        return new Class(name, methods);
    }

    // Kind param so both functions and methods can use this helper
    #function(): StmtFunction {
        const name = this.#consume(
            TokenType.IDENTIFIER,
            `Expect function name.`
        );
        this.#consume(TokenType.LEFT_PAREN, `Expect '(' after function name.`);
        const parameters = new Array<Token>();
        if (!this.#check(TokenType.RIGHT_PAREN)) {
            do {
                if (parameters.length >= 255) {
                    parseError(
                        this.#peek(),
                        "Can't have more then 255 parameters."
                    );
                }
                parameters.push(
                    this.#consume(
                        TokenType.IDENTIFIER,
                        "Expect parameter name."
                    )
                );
            } while (this.#match(TokenType.COMMA));
        }
        this.#consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");

        this.#consume(TokenType.LEFT_BRACE, `Expect '{' before function body.`);
        const body = this.#block();
        return new StmtFunction(name, parameters, body, false);
    }

    #method(): StmtFunction {
        const name = this.#consume(TokenType.IDENTIFIER, "Expect method name.");
        const parameters = new Array<Token>();
        let isGetter = false;

        if (this.#match(TokenType.LEFT_PAREN)) {
            if (!this.#check(TokenType.RIGHT_PAREN)) {
                do {
                    if (parameters.length >= 255) {
                        parseError(this.#peek(), "can't have more than 255 parameters.");
                    }
                    parameters.push(this.#consume(TokenType.IDENTIFIER, "Expect parameter name."));
                } while (this.#match(TokenType.COMMA));
            }
            this.#consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");
        } else {
            isGetter = true;
        }

        this.#consume(TokenType.LEFT_BRACE, "Expect '{' before method body.");
        const body = this.#block();
        return new StmtFunction(name, parameters, body, isGetter);

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
        if (this.#match(TokenType.FOR)) return this.#forStatement();
        if (this.#match(TokenType.IF)) return this.#ifStatement();
        if (this.#match(TokenType.PRINT)) return this.#printStatement();
        if (this.#match(TokenType.LEFT_BRACE)) return new Block(this.#block());
        if (this.#match(TokenType.WHILE)) return this.#whileStatement();
        if (this.#match(TokenType.RETURN)) return this.#returnStatement();
        return this.#expressionStatement();
    }

    #returnStatement(): Stmt {
        const keyword = this.#previous();
        let value: Expr | null = null;
        if (!this.#check(TokenType.SEMICOLON)) {
            value = this.#expression();
        }

        this.#consume(TokenType.SEMICOLON, "Expect ';' after return value.");
        return new Return(keyword, value);
    }

    #forStatement(): Stmt {
        this.#consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");

        let initializer: Stmt | null;
        if (this.#match(TokenType.SEMICOLON)) {
            initializer = null;
        } else if (this.#match(TokenType.VAR)) {
            initializer = this.#varDeclaration();
        } else {
            initializer = this.#expressionStatement();
        }

        let condition: Expr | null = null;
        if (!this.#check(TokenType.SEMICOLON)) {
            condition = this.#expression();
        }
        this.#consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

        let increment: Expr | null = null;
        if (!this.#check(TokenType.RIGHT_PAREN)) {
            increment = this.#expression();
        }
        this.#consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

        let body = this.#statement();

        if (increment !== null) {
            body = new Block([body, new Expression(increment)]);
        }

        if (condition === null) condition = new Literal(true);
        body = new While(condition, body);

        if (initializer !== null) {
            body = new Block([initializer, body]);
        }

        return body;
    }

    #whileStatement(): Stmt {
        this.#consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
        const condition = this.#expression();
        this.#consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.");
        const body = this.#statement();

        return new While(condition, body);
    }

    #ifStatement(): Stmt {
        this.#consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
        const condition = this.#expression();
        this.#consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

        const thenBranch = this.#statement();
        let elseBranch: Stmt | null = null;
        if (this.#match(TokenType.ELSE)) {
            elseBranch = this.#statement();
        }
        return new If(condition, thenBranch, elseBranch);
    }

    #block(): Array<Stmt> {
        const statements = new Array<Stmt>();

        while (!this.#check(TokenType.RIGHT_BRACE) && !this.#isAtEnd()) {
            const next = this.#declaration();
            if (next) statements.push(next);
        }

        this.#consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
        return statements;
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
        const expr = this.#or();

        if (this.#match(TokenType.EQUAL)) {
            const equals = this.#previous();
            const value = this.#assignment();

            if (expr instanceof Variable) {
                const name = expr.name;
                return new Assign(name, value);
            } else if (expr instanceof Get) {
                const get = expr;
                return new ExprSet(get.obj, get.name, value);
            }

            throw Parser.error(equals, "Invalid assignment target.");
        }

        return expr;
    }

    #or(): Expr {
        let expr = this.#and();

        while (this.#match(TokenType.OR)) {
            const operator = this.#previous();
            const right = this.#and();
            expr = new Logical(expr, operator, right);
        }

        return expr;
    }

    #and(): Expr {
        let expr = this.#equality();

        while (this.#match(TokenType.AND)) {
            const operator = this.#previous();
            const right = this.#equality();
            expr = new Logical(expr, operator, right);
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
        return this.#call();
    }

    #call(): Expr {
        let expr = this.#primary();

        while (true) {
            if (this.#match(TokenType.LEFT_PAREN)) {
                expr = this.#finishCall(expr);
            } else if (this.#match(TokenType.DOT)) {
                const name = this.#consume(TokenType.IDENTIFIER, "Expect property name after '.'.");
                expr = new Get(expr, name);
            } else {
                break;
            }
        }
        return expr;
    }

    #finishCall(callee: Expr): Expr {
        const args = new Array<Expr>();
        // Handles syntax like function()()()
        if (!this.#check(TokenType.RIGHT_PAREN)) {
            do {
                if (args.length >= 255) {
                    parseError(
                        this.#peek(),
                        "Can't have more than 255 arguments."
                    );
                }
                args.push(this.#expression());
            } while (this.#match(TokenType.COMMA));
        }
        const paren = this.#consume(
            TokenType.RIGHT_PAREN,
            "Expect ')' after arguments."
        );

        return new Call(callee, paren, args);
    }

    #primary(): Expr {
        if (this.#match(TokenType.FALSE)) return new Literal(false);
        if (this.#match(TokenType.TRUE)) return new Literal(true);
        if (this.#match(TokenType.NIL)) return new Literal(null);
        if (this.#match(TokenType.THIS)) return new This(this.#previous());

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

class ParseError extends Error { }
