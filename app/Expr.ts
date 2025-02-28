import Token from "./Token.js";

abstract class Expr {}

class Binary extends Expr {
  readonly left: Expr;
  readonly right: Expr;
  readonly operator: Token;

  constructor(left: Expr, operator: Token, right: Expr) {
    super();
    this.left = left;
    this.operator = operator;
    this.right = right;
  }
}
