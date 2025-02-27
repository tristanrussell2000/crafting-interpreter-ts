import fs from "fs";
import * as readline from "readline/promises";
import Scanner from "./Scanner.js";
let hadError = false;
function runFile(path) {
    const fileContent = fs.readFileSync(path, 'utf8');
    run(fileContent);
    if (hadError)
        process.exit(65);
}
async function runPrompt() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    while (true) {
        const line = await rl.question("> ");
        if (line == null)
            break;
        run(line);
        hadError = false;
    }
}
function run(source) {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();
    for (const token of tokens) {
        console.log(token.type, token.lexeme, token.literal);
    }
}
export function error(line, message, character) {
    if (!character)
        return report(line, "", `${message}`);
    report(line, "", `${message}: ${character}`);
}
function report(line, where, message) {
    console.error(`[line ${line}] Error${where}: ${message}`);
    hadError = true;
}
const args = process.argv.slice(2); // Skip the first two arguments (node path and script path)
let command = "";
let filename = "";
if (args.length > 2) {
    console.error("Usage: ./your_program.sh tokenize <filename>");
    process.exit(1);
}
else if (args.length < 1) {
    console.error("Usage: ./your_program.sh tokenize <filename>");
    process.exit(1);
}
else if (args.length === 1) {
    filename = args[0];
}
else if (args.length === 2) {
    command = args[0];
    filename = args[1];
}
if (command !== "tokenize") {
    runFile(filename);
}
else if (command === "tokenize") {
    runFile(filename);
}
