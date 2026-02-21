import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import path from "node:path";

function run(cmd: string) {
  return execSync(cmd, { encoding: "utf8", cwd: process.cwd() });
}

describe("cli primary flow", () => {
  it("use -> list -> show", () => {
    const schema = path.join(process.cwd(), "test/sample.openapi.json");
    const useOut = JSON.parse(run(`node dist/cli.js use ${schema} --service tickets --format json`));
    expect(useOut.ok).toBe(true);

    const listOut = JSON.parse(run(`node dist/cli.js list --format json`));
    expect(listOut.ok).toBe(true);
    expect(Array.isArray(listOut.data)).toBe(true);

    const showOut = JSON.parse(run(`node dist/cli.js show createTicket --format json`));
    expect(showOut.ok).toBe(true);
    expect(showOut.data.name).toContain("createTicket");
  });
});
