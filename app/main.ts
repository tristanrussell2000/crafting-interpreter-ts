import fs from "fs";
import * as readline from "readline/promises";
import Scanner from "./Scanner.js";
import Token from "./Token.js";
import TokenType from "./TokenType.js";
import { Parser } from "./Parser.js";
import { AstPrinter } from "./AstPrinter.js";
import { RuntimeError } from "./RuntimeError.js";
import { Interpreter } from "./Interpreter.js";

const interpreter = new Interpreter();
let hadError = false;
let hadRuntimeError = false;

function runFile(path: string) {
    const fileContent = fs.readFileSync(path, "utf8");
    run(fileContent);
    if (hadError) process.exit(65);
    if (hadRuntimeError) process.exit(70);
}

async function runPrompt() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    while (true) {
        const line = await rl.question("> ");
        if (line == null) break;
        run(line);
        hadError = false;
    }
}

function run(source: string) {
    const scanner: Scanner = new Scanner(source);
    const tokens: Array<Token> = scanner.scanTokens();
    const parser = new Parser(tokens);
    const statements = parser.parse();
    if (statements === null) return;

    interpreter.interpret(statements);
}

export function error(line: number, message: string, character?: string) {
    if (!character) return report(line, "", `${message}`);
    report(line, "", `${message}: ${character}`);
}

function report(line: number, where: string, message: string) {
    console.error(`[line ${line}] Error${where}: ${message}`);
    hadError = true;
}

export function parseError(token: Token, message: string) {
    if (token.type === TokenType.EOF) {
        report(token.line, " at end", message);
    } else {
        report(token.line, " at '" + token.lexeme + "'", message);
    }
}

export function runtimeError(error: RuntimeError) {
    console.error(error.message + "\n[line " + error.token.line + "]");
    hadRuntimeError = true;
}

const args = process.argv.slice(2); // Skip the first two arguments (node path and script path)
let command = "";
let filename = "";
if (args.length > 2) {
    console.error("Usage: ./your_program.sh command <filename>");
    process.exit(1);
} else if (args.length < 1) {
    // Ignore command
} else if (args.length === 1) {
    command = args[0];
} else if (args.length === 2) {
    command = args[0];
    filename = args[1];
}

// Ignore command for now
if (!filename) {
    runPrompt();
} else {
    runFile(filename);
}
