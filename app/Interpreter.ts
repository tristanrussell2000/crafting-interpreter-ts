import {
    Assign,
    Binary,
    Expr,
    Grouping,
    Literal,
    Logical,
    Unary,
    Variable,
    Visitor,
} from "./Expr.js";
import Token from "./Token.js";
import TokenType from "./TokenType.js";
import { RuntimeError } from "./RuntimeError.js";
import { runtimeError } from "./main.js";
import {
    Stmt,
    Expression,
    Print,
    Visitor as StmtVisitor,
    Var,
    Block,
    If,
} from "./Stmt.js";
import { Environment } from "./Environment.js";

export class Interpreter implements Visitor<Object | null>, StmtVisitor<void> {
    #environment = new Environment();

    interpret(statements: Array<Stmt | null>) {
        try {
            for (const statement of statements) {
                this.#execute(statement);
            }
        } catch (error) {
            if (error instanceof RuntimeError) {
                runtimeError(error);
            } else {
                console.error(error);
            }
        }
    }

    #execute(stmt: Stmt | null) {
        if (stmt === null) return;
        stmt.accept(this);
    }

    #executeBlock(statements: Array<Stmt>, environment: Environment) {
        const previous = this.#environment;
        try {
            this.#environment = environment;

            for (const statement of statements) {
                this.#execute(statement);
            }
        } finally {
            this.#environment = previous;
        }
    }

    #stringify(object: Object | null): string {
        if (object === null) return "nil";
        return object.toString();
    }

    #evaluate(expr: Expr): Object | null {
        return expr.accept(this);
    }

    #isTruthy(object: Object | null): boolean {
        if (object === null) return false;
        if (typeof object === "boolean") return object;
        return true;
    }

    #isEqual(a: Object | null, b: Object | null): boolean {
        return a === b;
    }

    #checkNumberOperand(operator: Token, operand: Object | null) {
        if (typeof operand === "number") return;
        throw new RuntimeError(operator, "Operand must be a number.");
    }

    #checkNumberOperands(
        operator: Token,
        left: Object | null,
        right: Object | null
    ) {
        if (typeof left === "number" && typeof right === "number") return;
        throw new RuntimeError(operator, "Operands must be numbers.");
    }

    visitLiteralExpr(expr: Literal): Object | null {
        return expr.value;
    }

    visitGroupingExpr(expr: Grouping): Object | null {
        return this.#evaluate(expr.expression);
    }

    visitUnaryExpr(expr: Unary): Object | null {
        const right = this.#evaluate(expr.right);

        switch (expr.operator.type) {
            case TokenType.MINUS:
                this.#checkNumberOperand(expr.operator, right);
                return -(right as number);
            case TokenType.BANG:
                return !this.#isTruthy(right);
        }

        return null;
    }

    visitBinaryExpr(expr: Binary): Object | null {
        const left = this.#evaluate(expr.left);
        const right = this.#evaluate(expr.right);

        switch (expr.operator.type) {
            case TokenType.MINUS:
                this.#checkNumberOperand(expr.operator, right);
                return <number>left - <number>right;
            case TokenType.SLASH:
                this.#checkNumberOperands(expr.operator, left, right);
                return <number>left / <number>right;
            case TokenType.STAR:
                this.#checkNumberOperands(expr.operator, left, right);
                return <number>left * <number>right;
            case TokenType.PLUS:
                if (typeof left === "number" && typeof right == "number") {
                    return left + right;
                }
                if (typeof left === "string" && typeof right === "string") {
                    return left + right;
                }
                throw new RuntimeError(
                    expr.operator,
                    "Operands must be two numbers or two strings."
                );
            case TokenType.GREATER:
                this.#checkNumberOperands(expr.operator, left, right);
                return <number>left > <number>right;
            case TokenType.GREATER_EQUAL:
                this.#checkNumberOperands(expr.operator, left, right);
                return <number>left >= <number>right;
            case TokenType.LESS:
                this.#checkNumberOperands(expr.operator, left, right);
                return <number>left < <number>right;
            case TokenType.LESS_EQUAL:
                this.#checkNumberOperands(expr.operator, left, right);
                return <number>left <= <number>right;
            case TokenType.BANG_EQUAL:
                return !this.#isEqual(left, right);
            case TokenType.EQUAL_EQUAL:
                return this.#isEqual(left, right);
        }
        return null;
    }

    visitVariableExpr(expr: Variable): Object | null {
        return this.#environment.get(expr.name);
    }

    visitAssignExpr(expr: Assign): Object | null {
        const value = this.#evaluate(expr.value);
        this.#environment.assign(expr.name, value);
        return value;
    }

    visitLogicalExpr(expr: Logical): Object | null {
        const left = this.#evaluate(expr.left);

        // Short-circuit
        if (expr.operator.type === TokenType.OR) {
            if (this.#isTruthy(left)) return left;
        } else if (expr.operator.type === TokenType.AND) {
            if (!this.#isTruthy(left)) return left;
        }

        return this.#evaluate(expr.right);
    }

    visitExpressionStmt(stmt: Expression) {
        this.#evaluate(stmt.expression);
    }

    visitPrintStmt(stmt: Print) {
        const value = this.#evaluate(stmt.expression);
        console.log(this.#stringify(value));
    }

    visitVarStmt(stmt: Var) {
        let value: Object | null = null;
        if (stmt.initializer !== null) {
            value = this.#evaluate(stmt.initializer);
        }
        this.#environment.define(stmt.name.lexeme, value);
    }

    visitBlockStmt(stmt: Block) {
        this.#executeBlock(stmt.statements, new Environment(this.#environment));
    }

    visitIfStmt(stmt: If): void {
        if (this.#isTruthy(this.#evaluate(stmt.condition))) {
            this.#execute(stmt.thenBranch);
        } else if (stmt.elseBranch !== null) {
            this.#execute(stmt.elseBranch);
        }
    }
}
