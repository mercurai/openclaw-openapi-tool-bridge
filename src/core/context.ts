import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { normalizeOpenApi } from "../integrations/oas-normalizer.js";
import { compileTools } from "./compiler.js";
import { cacheDir, loadState, saveState } from "./state-manager.js";
import { ToolDef } from "../types.js";

export interface ActiveContext {
  service: string;
  schemaInput: string;
  fingerprint: string;
  tools: ToolDef[];
  normalized: any;
}

export async function useSchema(schemaInput: string, service: string): Promise<ActiveContext> {
  const normalized = await normalizeOpenApi(schemaInput, true);
  const tools = compileTools(normalized as any, service);
  const fingerprint = sha(JSON.stringify({ service, schemaInput, tools: tools.map((t) => t.name) }));

  const cdir = cacheDir();
  await fs.mkdir(cdir, { recursive: true });
  const cfile = path.join(cdir, `${fingerprint}.json`);
  await fs.writeFile(cfile, JSON.stringify({ normalized, tools }, null, 2) + "\n", "utf8");

  const st = await loadState();
  st.active = { service, schemaInput, fingerprint, cacheFile: cfile, updatedAt: new Date().toISOString() };
  await saveState(st);

  return { service, schemaInput, fingerprint, tools, normalized };
}

export async function getActiveContext(): Promise<ActiveContext> {
  const st = await loadState();
  if (!st.active) throw new Error("No active schema context. Run: openapi-bridge use <schema>");
  const raw = JSON.parse(await fs.readFile(st.active.cacheFile, "utf8"));
  return {
    service: st.active.service,
    schemaInput: st.active.schemaInput,
    fingerprint: st.active.fingerprint,
    tools: raw.tools,
    normalized: raw.normalized,
  };
}

function sha(v: string): string {
  return crypto.createHash("sha256").update(v).digest("hex");
}
