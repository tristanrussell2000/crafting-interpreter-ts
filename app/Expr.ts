import Token from "./Token.js";

export abstract class Expr{
  abstract accept<R>(visitor: Visitor<R>): R;
}

export interface Visitor<R> {
  visitTernaryExpr(expr: Ternary): R;
  visitBinaryExpr(expr: Binary): R;
  visitGroupingExpr(expr: Grouping): R;
  visitLiteralExpr(expr: Literal): R;
  visitUnaryExpr(expr: Unary): R;
}

export class Ternary extends Expr {
    readonly condition: Expr;
    readonly left: Expr;
    readonly right: Expr;

    constructor(condition: Expr, left: Expr, right: Expr) {
    super()
        this.condition = condition;
        this.left = left;
        this.right = right;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitTernaryExpr(this);
    }
}
export class Binary extends Expr {
    readonly left: Expr;
    readonly operator: Token;
    readonly right: Expr;

    constructor(left: Expr, operator: Token, right: Expr) {
    super()
        this.left = left;
        this.operator = operator;
        this.right = right;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitBinaryExpr(this);
    }
}
export class Grouping extends Expr {
    readonly expression: Expr;

    constructor(expression: Expr) {
    super()
        this.expression = expression;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitGroupingExpr(this);
    }
}
export class Literal extends Expr {
    readonly value: Object|null;

    constructor(value: Object|null) {
    super()
        this.value = value;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitLiteralExpr(this);
    }
}
export class Unary extends Expr {
    readonly operator: Token;
    readonly right: Expr;

    constructor(operator: Token, right: Expr) {
    super()
        this.operator = operator;
        this.right = right;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitUnaryExpr(this);
    }
}

