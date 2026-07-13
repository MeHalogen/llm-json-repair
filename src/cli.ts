#!/usr/bin/env node

import { cleanJson } from "./index.js";
import { readFile } from "node:fs/promises";

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help") || args.length === 0) {
    console.log(`
Usage: llm-json-repair <file-path-or-json-string>

Options:
  -h, --help            Show help info
`);
    process.exit(0);
  }

  const input = args[0];
  let jsonText = input;

  try {
    // Try reading as a file path first, fallback to raw string input
    const fileContent = await readFile(input, "utf8").catch(() => null);
    if (fileContent !== null) {
      jsonText = fileContent;
    }
    
    const repaired = cleanJson(jsonText);
    process.stdout.write(repaired + "\n");
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
