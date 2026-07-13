/**
 * Clean and parse dirty or truncated JSON from LLM outputs.
 */
export function cleanJson(jsonStr: string): string {
  // 1. Strip markdown fences if present
  let cleaned = jsonStr.trim();
  const markdownMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownMatch) {
    cleaned = markdownMatch[1].trim();
  }

  // 2. Strip comments and convert single quotes to double quotes,
  // while tracking open structures to repair truncated JSON.
  let result = "";
  let i = 0;
  const stack: ("{" | "[")[] = [];
  let inString = false;
  let quoteChar = "";

  while (i < cleaned.length) {
    const char = cleaned[i];

    if (inString) {
      if (char === "\\" && i + 1 < cleaned.length) {
        result += char + cleaned[i + 1];
        i += 2;
        continue;
      }
      if (char === quoteChar) {
        inString = false;
        result += '"'; // Ensure all strings end in double quotes
      } else {
        result += char;
      }
      i++;
      continue;
    }

    // Start of string
    if (char === '"' || char === "'") {
      inString = true;
      quoteChar = char;
      result += '"';
      i++;
      continue;
    }

    // Skip comments
    if (char === "/" && cleaned[i + 1] === "/") {
      const nextNewline = cleaned.indexOf("\n", i);
      i = nextNewline === -1 ? cleaned.length : nextNewline;
      continue;
    }
    if (char === "/" && cleaned[i + 1] === "*") {
      const nextClose = cleaned.indexOf("*/", i);
      i = nextClose === -1 ? cleaned.length : nextClose + 2;
      continue;
    }

    // Track brackets and braces
    if (char === "{") {
      stack.push("{");
    } else if (char === "[") {
      stack.push("[");
    } else if (char === "}") {
      if (stack[stack.length - 1] === "{") {
        stack.pop();
      }
    } else if (char === "]") {
      if (stack[stack.length - 1] === "[") {
        stack.pop();
      }
    }

    result += char;
    i++;
  }

  // 3. Repair unclosed string if we ended while parsing a string
  if (inString) {
    result += '"';
  }

  // 4. Remove trailing commas
  result = result.replace(/,\s*([}\]])/g, "$1");

  // 5. Check if the JSON is cut off after a colon or comma (e.g. `{"name":` or `[1,`)
  result = result.trim();
  if (result.endsWith(":")) {
    result += "null";
  } else if (result.endsWith(",")) {
    result = result.slice(0, -1);
  }

  // 6. Close any open braces or brackets
  while (stack.length > 0) {
    const open = stack.pop();
    if (open === "{") {
      result += "}";
    } else if (open === "[") {
      result += "]";
    }
  }

  return result;
}

/**
 * Clean and parse JSON. Throws on unrecoverable syntax errors.
 */
export function parseJson<T = any>(jsonStr: string): T {
  const cleaned = cleanJson(jsonStr);
  return JSON.parse(cleaned) as T;
}
