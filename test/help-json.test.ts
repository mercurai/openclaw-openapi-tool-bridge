import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";

describe("help-json", () => {
  it("returns cli.v1 envelope", () => {
    const out = execSync("node dist/cli.js help-json", { encoding: "utf8" });
    const json = JSON.parse(out);
    expect(json.ok).toBe(true);
    expect(json.meta.schemaVersion).toBe("cli.v1");
    expect(Array.isArray(json.data.commands)).toBe(true);
  });
});
