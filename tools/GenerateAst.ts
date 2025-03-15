import process from "process";
import fs from "fs";

const args = process.argv.slice(2);

if (args.length != 1) {
    console.error("Usage: GenerateAst.js <output directory>");
    process.exit(64);
}

const outputDir = args[0];

function defineType(
    writer: fs.WriteStream,
    baseName: string,
    className: string,
    fields: string
) {
    const fieldList = fields.split(", ");
    writer.write("export class " + className + " extends " + baseName + " {\n");

    for (const field of fieldList) {
        writer.write("    readonly " + field + ";\n");
    }

    writer.write("\n");

    writer.write("    constructor(" + fields + ") {\n");
    writer.write("        super()\n");
    for (const field of fieldList) {
        const name = field.split(": ")[0];
        writer.write("        this." + name + " = " + name + ";\n");
    }

    writer.write("    }\n");

    writer.write("\n");
    writer.write("    accept<R>(visitor: Visitor<R>): R {\n");
    writer.write(
        "        return visitor.visit" + className + baseName + "(this);\n"
    );
    writer.write("    }\n");

    writer.write("}\n");
}

function defineVisitor(
    writer: fs.WriteStream,
    baseName: string,
    types: string[]
) {
    writer.write("export interface Visitor<R> {\n");

    for (const type of types) {
        const typeName = type.split("-")[0];
        writer.write(
            "  visit" +
            typeName +
            baseName +
            "(" +
            baseName.toLowerCase() +
            ": " +
            typeName +
            "): R;\n"
        );
    }
    writer.write("}\n\n");
}

function defineAst(outputDir: string, baseName: string, types: Array<string>) {
    const path = outputDir + "/" + baseName + ".ts";
    const writer = fs.createWriteStream(path);

    writer.write('import Token from "./Token.js";\n');
    writer.write('import { FunctionType } from "./Resolver.js";\n');
    if (baseName != "Expr")
        writer.write("import { Expr } from './Expr.js';\n\n");

    writer.write("export abstract class " + baseName + "{\n");
    writer.write("  abstract accept<R>(visitor: Visitor<R>): R;\n");
    writer.write("}\n\n");

    defineVisitor(writer, baseName, types);

    for (const type of types) {
        const className = type.split("-")[0].trim();
        const fields = type.split("-")[1].trim();
        defineType(writer, baseName, className, fields);
    }

    writer.write("\n");

    writer.end();
}

defineAst(outputDir, "Expr", [
    "Binary- left: Expr, operator: Token, right: Expr",
    "Grouping- expression: Expr",
    "Literal- value: Object|null",
    "Unary- operator: Token, right: Expr",
    "Variable- name: Token",
    "Assign- name: Token, value: Expr",
    "Logical- left: Expr, operator: Token, right: Expr",
    "Call- callee: Expr, paren: Token, args: Array<Expr>",
    "Get- obj: Expr, name: Token",
    "Set- obj: Expr, name: Token, value: Expr",
    "This- name: Token"
]);

defineAst(outputDir, "Stmt", [
    "Expression- expression: Expr",
    "If- condition: Expr, thenBranch: Stmt, elseBranch: Stmt | null",
    "Print- expression: Expr",
    "Var- name: Token, initializer: Expr|null",
    "Block- statements: Array<Stmt>",
    "While- condition: Expr, body: Stmt",
    "Function- name: Token, params: Array<Token>, body: Array<Stmt>, type: FunctionType",
    "Return- keyword: Token, value: Expr | null",
    "Class- name: Token, methods: Array<Function>"
]);
