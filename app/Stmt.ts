import Token from "./Token.js";
import { Expr, Variable } from './Expr.js';

export abstract class Stmt{
  abstract accept<R>(visitor: Visitor<R>): R;
}

export interface Visitor<R> {
  visitExpressionStmt(stmt: Expression): R;
  visitIfStmt(stmt: If): R;
  visitPrintStmt(stmt: Print): R;
  visitVarStmt(stmt: Var): R;
  visitBlockStmt(stmt: Block): R;
  visitWhileStmt(stmt: While): R;
  visitFunctionStmt(stmt: Function): R;
  visitReturnStmt(stmt: Return): R;
  visitClassStmt(stmt: Class): R;
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
export class While extends Stmt {
    readonly condition: Expr;
    readonly body: Stmt;

    constructor(condition: Expr, body: Stmt) {
        super()
        this.condition = condition;
        this.body = body;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitWhileStmt(this);
    }
}
export class Function extends Stmt {
    readonly name: Token;
    readonly params: Array<Token>;
    readonly body: Array<Stmt>;

    constructor(name: Token, params: Array<Token>, body: Array<Stmt>) {
        super()
        this.name = name;
        this.params = params;
        this.body = body;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitFunctionStmt(this);
    }
}
export class Return extends Stmt {
    readonly keyword: Token;
    readonly value: Expr | null;

    constructor(keyword: Token, value: Expr | null) {
        super()
        this.keyword = keyword;
        this.value = value;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitReturnStmt(this);
    }
}
export class Class extends Stmt {
    readonly name: Token;
    readonly superclass: Variable|null;
    readonly methods: Array<Function>;

    constructor(name: Token, superclass: Variable|null, methods: Array<Function>) {
        super()
        this.name = name;
        this.superclass = superclass;
        this.methods = methods;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitClassStmt(this);
    }
}

