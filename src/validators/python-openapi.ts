import { spawnSync } from "node:child_process";

export function runPythonOpenApiValidator(schemaFile: string): { ok: boolean; stdout: string; stderr: string } {
  const cmd = spawnSync("python3", ["-m", "openapi_spec_validator", schemaFile], {
    encoding: "utf8",
  });

  if (cmd.error && (cmd.error as any).code === "ENOENT") {
    return { ok: false, stdout: "", stderr: "python3 not found" };
  }

  return {
    ok: cmd.status === 0,
    stdout: cmd.stdout || "",
    stderr: cmd.stderr || "",
  };
}
