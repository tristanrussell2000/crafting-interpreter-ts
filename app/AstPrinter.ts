import { Expr, Visitor, Binary, Grouping, Literal, Unary } from "./Expr.js";
import TokenType from "./TokenType.js";
import Token from "./Token.js";

class AstPrinter implements Visitor<string> {
    print(expr: Expr): string {
        return expr.accept(this);
    }

    #parenthesize(name: string, ...exprs: Expr[]): string {
        let output = "";
        output += "(";
        output += name;
        for (const expr of exprs) {
            output += " ";
            output += expr.accept(this);
        }
        output += ")";
        return output;
    }

    visitBinaryExpr(expr: Binary): string {
        return this.#parenthesize(expr.operator.lexeme, expr.left, expr.right);
    }

    visitGroupingExpr(expr: Grouping): string {
        return this.#parenthesize("group", expr.expression);
    }

    visitLiteralExpr(expr: Literal): string {
        if (expr.value == null) return "nil";
        return expr.value.toString();
    }

    visitUnaryExpr(expr: Unary): string {
        return this.#parenthesize(expr.operator.lexeme, expr.right);
    }
}

class RPNPrinter implements Visitor<string> {
    print(expr: Expr): string {
        return expr.accept(this);
    }

    #rpn(operator: string, ...exprs: Expr[]) {
        let output = "";
        for (const expr of exprs) {
            output += expr.accept(this);
            output += " ";
        }
        output += operator;
        output = output.trim();
        return output;
    }

    visitBinaryExpr(expr: Binary): string {
        return this.#rpn(expr.operator.lexeme, expr.left, expr.right);
    }

    visitGroupingExpr(expr: Grouping): string {
        return this.#rpn("", expr.expression);
    }

    visitLiteralExpr(expr: Literal): string {
        if (expr.value == null) return "nil";
        return expr.value.toString();
    }

    visitUnaryExpr(expr: Unary): string {
        return this.#rpn(expr.operator.lexeme, expr.right);
    }
}

const expression: Expr = new Binary(
    new Unary(new Token(TokenType.MINUS, "-", null, 1), new Literal(123)),
    new Token(TokenType.STAR, "*", null, 1),
    new Grouping(new Literal(45.67))
);

const expression2: Expr = new Binary(
    new Grouping(
        new Binary(
            new Literal(1),
            new Token(TokenType.PLUS, "+", null, 1),
            new Literal(2)
        )
    ),
    new Token(TokenType.STAR, "*", null, 1),
    new Grouping(
        new Binary(
            new Literal(3),
            new Token(TokenType.PLUS, "+", null, 1),
            new Literal(4)
        )
    )
);

console.log("testing rpn ", new RPNPrinter().print(expression2));
