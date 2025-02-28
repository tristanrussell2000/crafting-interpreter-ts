import { Expr, Visitor, Binary, Grouping, Literal, Unary } from "./Expr.js";
import TokenType from "./TokenType.js";
import Token from "./Token.js";

class AstPrinter implements Visitor<string> {
    print(expr: Expr): string {
        return expr.accept(this);
    }

    #parenthesize(name: String, ...exprs: Expr[]): string {
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
