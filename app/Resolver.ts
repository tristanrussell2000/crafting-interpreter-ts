import {
    Assign,
    Binary,
    Call,
    Expr,
    Visitor as ExprVisitor,
    Grouping,
    Literal,
    Logical,
    Unary,
    Variable,
} from "./Expr.js";
import { Interpreter } from "./Interpreter.js";
import { parseError } from "./main.js";
import {
    Block,
    Function as StmtFunction,
    Stmt,
    Visitor as StmtVisitor,
    Var,
    Expression,
    If,
    Print,
    Return,
    While,
} from "./Stmt.js";
import Token from "./Token.js";

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
    readonly #interpreter: Interpreter;
    // False marks variable delcaration not ready yet
    readonly #scopes: Array<Map<string, boolean>> = [];
    #currentFunction = FunctionType.NONE;

    constructor(interpreter: Interpreter) {
        this.#interpreter = interpreter;
    }

    resolveStatements(statements: Array<Stmt | null>) {
        for (const statement of statements) {
            if (statement === null) continue;
            this.#resolve(statement);
        }
    }

    #resolve(stmtOrExpr: Stmt | Expr) {
        stmtOrExpr.accept(this);
    }

    #beginScope() {
        this.#scopes.push(new Map());
    }

    #endScope() {
        this.#scopes.pop();
    }

    #declare(name: Token) {
        if (this.#scopes.length === 0) return;

        const scope = this.#scopes.at(-1);

        if (scope?.has(name.lexeme)) {
            parseError(
                name,
                "Already a variable with this name in this scope."
            );
        }

        scope?.set(name.lexeme, false);
    }

    #define(name: Token) {
        if (this.#scopes.length === 0) return;
        this.#scopes.at(-1)?.set(name.lexeme, true);
    }

    #resolveFunction(func: StmtFunction, type: FunctionType) {
        const enclosingFunction = this.#currentFunction;
        this.#currentFunction = type;
        this.#beginScope();
        for (const param of func.params) {
            this.#declare(param);
            this.#define(param);
        }
        this.resolveStatements(func.body);
        this.#endScope();
        this.#currentFunction = enclosingFunction;
    }

    #resolveLocal<T extends { name: Token } & Expr>(expr: T) {
        for (let i = this.#scopes.length - 1; i >= 0; i--) {
            if (this.#scopes.at(i)?.has(expr.name.lexeme)) {
                this.#interpreter.resolve(expr, this.#scopes.length - 1 - i);
                return;
            }
        }
    }

    visitBlockStmt(stmt: Block) {
        this.#beginScope();
        this.resolveStatements(stmt.statements);
        this.#endScope();
    }

    visitVarStmt(stmt: Var): void {
        this.#declare(stmt.name);
        if (stmt.initializer !== null) {
            this.#resolve(stmt.initializer);
        }
        this.#define(stmt.name);
    }

    visitVariableExpr(expr: Variable): void {
        if (
            this.#scopes.length !== 0 &&
            this.#scopes.at(-1)?.get(expr.name.lexeme) === false
        ) {
            parseError(
                expr.name,
                "Can't read local variable in its own initializer."
            );
        }

        this.#resolveLocal(expr);
    }

    visitAssignExpr(expr: Assign): void {
        this.#resolve(expr.value);
        this.#resolveLocal(expr);
    }

    visitFunctionStmt(stmt: StmtFunction): void {
        // Allow function to refer to itself
        this.#declare(stmt.name);
        this.#define(stmt.name);
        this.#resolveFunction(stmt, FunctionType.FUNCTION);
    }

    visitExpressionStmt(stmt: Expression): void {
        this.#resolve(stmt.expression);
    }

    visitIfStmt(stmt: If): void {
        this.#resolve(stmt.condition);
        this.#resolve(stmt.thenBranch);
        if (stmt.elseBranch !== null) this.#resolve(stmt.elseBranch);
    }

    visitPrintStmt(stmt: Print): void {
        this.#resolve(stmt.expression);
    }

    visitReturnStmt(stmt: Return): void {
        if (this.#currentFunction === FunctionType.NONE) {
            parseError(stmt.keyword, "Can't return from top-level code");
        }
        if (stmt.value !== null) {
            this.#resolve(stmt.value);
        }
    }

    visitWhileStmt(stmt: While): void {
        this.#resolve(stmt.condition);
        this.#resolve(stmt.body);
    }

    visitBinaryExpr(expr: Binary): void {
        this.#resolve(expr.left);
        this.#resolve(expr.right);
    }

    visitCallExpr(expr: Call): void {
        this.#resolve(expr.callee);
        for (const arg of expr.args) {
            this.#resolve(arg);
        }
    }

    visitGroupingExpr(expr: Grouping): void {
        this.#resolve(expr.expression);
    }

    visitLiteralExpr(expr: Literal): void {
        return;
    }

    visitLogicalExpr(expr: Logical): void {
        this.#resolve(expr.left);
        this.#resolve(expr.right);
    }

    visitUnaryExpr(expr: Unary): void {
        this.#resolve(expr.right);
    }
}

enum FunctionType {
    NONE,
    FUNCTION,
}
