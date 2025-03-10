import Token from "./Token.js";
import { Expr } from './Expr.js';

export abstract class Stmt{
  abstract accept<R>(visitor: Visitor<R>): R;
}

export interface Visitor<R> {
  visitExpressionStmt(stmt: Expression): R;
  visitIfStmt(stmt: If): R;
  visitPrintStmt(stmt: Print): R;
  visitVarStmt(stmt: Var): R;
  visitBlockStmt(stmt: Block): R;
}

export class Expression extends Stmt {
    readonly expression: Expr;

    constructor(expression: Expr) {
        super()
        this.expression = expression;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitExpressionStmt(this);
    }
}
export class If extends Stmt {
    readonly condition: Expr;
    readonly thenBranch: Stmt;
    readonly elseBranch: Stmt | null;

    constructor(condition: Expr, thenBranch: Stmt, elseBranch: Stmt | null) {
        super()
        this.condition = condition;
        this.thenBranch = thenBranch;
        this.elseBranch = elseBranch;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitIfStmt(this);
    }
}
export class Print extends Stmt {
    readonly expression: Expr;

    constructor(expression: Expr) {
        super()
        this.expression = expression;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitPrintStmt(this);
    }
}
export class Var extends Stmt {
    readonly name: Token;
    readonly initializer: Expr|null;

    constructor(name: Token, initializer: Expr|null) {
        super()
        this.name = name;
        this.initializer = initializer;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitVarStmt(this);
    }
}
export class Block extends Stmt {
    readonly statements: Array<Stmt>;

    constructor(statements: Array<Stmt>) {
        super()
        this.statements = statements;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitBlockStmt(this);
    }
}

