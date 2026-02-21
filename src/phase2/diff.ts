import { spawnSync } from "node:child_process";

export function runBumpDiff(oldSchema: string, newSchema: string): { ok: boolean; stdout: string; stderr: string } {
  const cmd = spawnSync("bump", ["diff", oldSchema, newSchema], { encoding: "utf8" });

  if (cmd.error && (cmd.error as any).code === "ENOENT") {
    return { ok: false, stdout: "", stderr: "bump CLI not installed" };
  }

  return {
    ok: cmd.status === 0,
    stdout: cmd.stdout || "",
    stderr: cmd.stderr || "",
  };
}
