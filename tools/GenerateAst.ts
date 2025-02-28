import process from "process";
import fs from "fs";

const args = process.argv.slice(2);

if (args.length != 1) {
  console.error("Usage: GenerateAst.js <output directory>");
  process.exit(64);
}

const outputDir = args[0];

function defineType(
  stream: fs.WriteStream,
  baseName: string,
  className: string,
  fields: string
) {
  const fieldList = fields.split(", ");
  stream.write("export class " + className + " extends " + baseName + " {\n");

  for (const field of fieldList) {
    stream.write("  readonly " + field + ";\n");
  }

  stream.write("\n");

  stream.write("  constructor(" + fields + ") {\n");
  stream.write("  super()\n");
  for (const field of fieldList) {
    const name = field.split(": ")[0];
    stream.write("      this." + name + " = " + name + ";\n");
  }

  stream.write("  }\n");

  stream.write("}\n");
}

function defineAst(outputDir: string, baseName: string, types: Array<String>) {
  const path = outputDir + "/" + baseName + ".ts";
  const stream = fs.createWriteStream(path);

  stream.write('import Token from "./Token.js";\n\n');

  stream.write("class " + baseName + "{\n");
  stream.write("}\n");

  for (const type of types) {
    const className = type.split("-")[0].trim();
    const fields = type.split("-")[1].trim();
    defineType(stream, baseName, className, fields);
  }

  stream.end();
}

defineAst(outputDir, "Expr", [
  "Binary- left: Expr, operator: Token, right: Expr",
  "Grouping- expression: Expr",
  "Literal- value: Object",
  "Unary- operator: Token, right: Expr",
]);
