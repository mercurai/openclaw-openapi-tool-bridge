import { describe, it, expect } from "vitest";
import { loadOpenApiSchema } from "../src/core/schema-loader.js";
import { compileTools } from "../src/core/compiler.js";
import path from "node:path";

describe("compileTools", () => {
  it("compiles openapi operations to tool defs", async () => {
    const doc = await loadOpenApiSchema(path.join(process.cwd(), "test/sample.openapi.json"));
    const tools = compileTools(doc, "tickets");

    expect(tools.length).toBe(2);
    expect(tools[0].name).toContain("openapi.tickets");
    expect(tools.some((t) => t.name.endsWith("createTicket"))).toBe(true);
    expect(tools.some((t) => t.name.endsWith("getTicket"))).toBe(true);
  });
});
