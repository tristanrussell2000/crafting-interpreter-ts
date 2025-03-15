import {
    Assign,
    Binary,
    Call,
    Expr,
    Get,
    Grouping,
    Literal,
    Logical,
    Set,
    Super,
    This,
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
    While,
    Function,
    Return,
    Class,
} from "./Stmt.js";
import { Environment } from "./Environment.js";
import { LoxCallable, isLoxCallable } from "./LoxCallable.js";
import { LoxFunction } from "./LoxFunction.js";
import { ReturnException } from "./ReturnException.js";
import { LoxClass } from "./LoxClass.js";
import { LoxInstance } from "./LoxInstance.js";

export class Interpreter implements Visitor<Object | null>, StmtVisitor<void> {
    readonly globals = new Environment();
    #environment = this.globals;
    readonly #locals = new Map<Expr, number>();

    constructor() {
        const clock: LoxCallable = {
            arity: function (): number {
                return 0;
            },

            call: function (
                interpreter: Interpreter,
                args: Array<Object | null>
            ): Object | null {
                return Date.now();
            },
        };
        Object.getPrototypeOf(clock).toString = function () {
            return "<native fn>";
        };
        this.globals.define("clock", clock);
    }

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

    resolve(expr: Expr, depth: number) {
        this.#locals.set(expr, depth);
    }

    #lookUpVariable<T extends { name: Token } & Expr>(expr: T) {
        const distance = this.#locals.get(expr);
        if (distance !== undefined) {
            return this.#environment.getAt(distance, expr.name.lexeme);
        } else {
            return this.globals.get(expr.name);
        }
    }

    executeBlock(statements: Array<Stmt>, environment: Environment) {
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
        return this.#lookUpVariable(expr);
    }

    visitAssignExpr(expr: Assign): Object | null {
        const value = this.#evaluate(expr.value);
        let distance = this.#locals.get(expr);
        if (distance !== undefined) {
            this.#environment.assignAt(distance, expr.name, value);
        } else {
            this.globals.assign(expr.name, value);
        }
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

    visitCallExpr(expr: Call): Object | null {
        const callee = this.#evaluate(expr.callee);
        if (!isLoxCallable(callee)) {
            throw new RuntimeError(
                expr.paren,
                "Can only call functions and classes."
            );
        }

        const args = new Array<Object | null>();
        for (const arg of expr.args) {
            args.push(this.#evaluate(arg));
        }

        if (args.length != callee.arity()) {
            throw new RuntimeError(
                expr.paren,
                `Expected ${callee.arity()} arguments but got ${args.length}.`
            );
        }

        return callee.call(this, args);
    }

    visitFunctionStmt(stmt: Function): void {
        const func = new LoxFunction(stmt, this.#environment, false);
        this.#environment.define(stmt.name.lexeme, func);
    }

    visitReturnStmt(stmt: Return): void {
        let value: Object | null = null;
        if (stmt.value !== null) value = this.#evaluate(stmt.value);

        throw new ReturnException(value);
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
        this.executeBlock(stmt.statements, new Environment(this.#environment));
    }

    visitIfStmt(stmt: If) {
        if (this.#isTruthy(this.#evaluate(stmt.condition))) {
            this.#execute(stmt.thenBranch);
        } else if (stmt.elseBranch !== null) {
            this.#execute(stmt.elseBranch);
        }
    }

    visitWhileStmt(stmt: While) {
        while (this.#isTruthy(this.#evaluate(stmt.condition))) {
            this.#execute(stmt.body);
        }
    }

    visitClassStmt(stmt: Class): void {
        let superclass: Object | null = null;
        if (stmt.superclass !== null) {
            superclass = this.#evaluate(stmt.superclass);
            if (!(superclass instanceof LoxClass)) {
                throw new RuntimeError(stmt.superclass.name, "Superclass must be a class.");
            }
        }
        this.#environment.define(stmt.name.lexeme, null);

        if (stmt.superclass !== null) {
            this.#environment = new Environment(this.#environment);
            this.#environment.define("super", superclass);
        }

        const methods: Map<string, LoxFunction> = new Map();
        for (const method of stmt.methods) {
            const func = new LoxFunction(method, this.#environment, method.name.lexeme === "init");
            methods.set(method.name.lexeme, func);
        }
        const klass: LoxClass = new LoxClass(stmt.name.lexeme, superclass, methods);

        if (superclass != null) {
            this.#environment = this.#environment.enclosing ?? this.#environment;
        }
        this.#environment.assign(stmt.name, klass);
    }

    visitGetExpr(expr: Get): Object | null {
        const obj = this.#evaluate(expr.obj);
        if (obj instanceof LoxInstance) {
            return obj.get(expr.name);
        }
        throw new RuntimeError(expr.name, "Only instances have properties.");
    }

    visitSetExpr(expr: Set): Object | null {
        const obj = this.#evaluate(expr.obj);

        if (!(obj instanceof LoxInstance)) {
            throw new RuntimeError(expr.name, "Only instances have fields.");
        }

        const value = this.#evaluate(expr.value);
        obj.set(expr.name, value);
        return value;
    }

    visitSuperExpr(expr: Super): Object | null {
        const distance = this.#locals.get(expr);
        if (!distance) throw new RuntimeError(expr.name, "Super not defined in this context.");

        const superclass = this.#environment.getAt(distance, "super");
        if (!(superclass instanceof LoxClass)) throw new RuntimeError(expr.name, "Super must refer to a valid class.");

        const obj = this.#environment.getAt(distance - 1, "this");
        if (!(obj instanceof LoxInstance)) throw new RuntimeError(expr.name, "'This' not defined in this context.");

        const method = superclass.findMethod(expr.method.lexeme);
        if (method === null) {
            throw new RuntimeError(expr.method, `Undefined property '${expr.method.lexeme}'.`);
        }

        return method?.bind(obj);
    }

    visitThisExpr(expr: This): Object | null {
        return this.#lookUpVariable(expr);
    }
}
