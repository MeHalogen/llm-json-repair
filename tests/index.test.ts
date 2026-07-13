import { describe, it, expect } from "vitest";
import { cleanJson, parseJson } from "../src/index.js";

describe("cleanJson", () => {
  it("should strip markdown fences and comments", () => {
    const input = `
      \`\`\`json
      {
        // User config
        "port": 8080, /* Dev port */
        "host": "localhost"
      }
      \`\`\`
    `;
    const clean = cleanJson(input);
    const parsed = JSON.parse(clean);
    expect(parsed.port).toBe(8080);
    expect(parsed.host).toBe("localhost");
  });

  it("should remove trailing commas", () => {
    const input = '{"list": [1, 2, 3, ], "port": 80, }';
    const clean = cleanJson(input);
    expect(clean).toBe('{"list": [1, 2, 3], "port": 80}');
    const parsed = JSON.parse(clean);
    expect(parsed.list.length).toBe(3);
  });

  it("should repair truncated JSON", () => {
    const input = '{"status": "ok", "data": {"users": [{"name": "John';
    const clean = cleanJson(input);
    expect(clean).toContain('"name": "John"');
    const parsed = parseJson(clean);
    expect(parsed.status).toBe("ok");
    expect(parsed.data.users[0].name).toBe("John");
  });

  it("should repair cut off colon", () => {
    const input = '{"status":';
    const clean = cleanJson(input);
    const parsed = parseJson(clean);
    expect(parsed.status).toBeNull();
  });
});
