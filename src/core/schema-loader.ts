import $RefParser from "@apidevtools/json-schema-ref-parser";
import fs from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { OpenApiDoc } from "../types.js";

export async function loadOpenApiSchema(input: string): Promise<OpenApiDoc> {
  const raw = await readInput(input);
  const parsed = parseSchema(raw, input);
  const deref = (await $RefParser.dereference(parsed as any)) as OpenApiDoc;
  if (!deref?.paths) throw new Error("Invalid OpenAPI schema: missing paths");

  // Normalize relative server URLs when schema source is remote.
  if (/^https?:\/\//.test(input) && Array.isArray(deref.servers)) {
    const origin = new URL(input).origin;
    deref.servers = deref.servers.map((s) => {
      if (!s?.url) return s;
      if (/^https?:\/\//.test(s.url)) return s;
      if (s.url.startsWith("/")) return { ...s, url: `${origin}${s.url}` };
      return { ...s, url: `${origin}/${s.url}` };
    });
  }

  return deref;
}

async function readInput(input: string): Promise<string> {
  if (/^https?:\/\//.test(input)) {
    const res = await fetch(input);
    if (!res.ok) throw new Error(`Failed to fetch schema: ${res.status}`);
    return await res.text();
  }
  return await fs.readFile(path.resolve(input), "utf8");
}

function parseSchema(raw: string, source: string): any {
  const isYaml = source.endsWith(".yaml") || source.endsWith(".yml");
  if (isYaml) return parseYaml(raw);
  try {
    return JSON.parse(raw);
  } catch {
    return parseYaml(raw);
  }
}
