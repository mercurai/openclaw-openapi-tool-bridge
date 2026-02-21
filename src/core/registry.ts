import crypto from "node:crypto";
import { compileTools } from "./compiler.js";
import { loadOpenApiSchema } from "./schema-loader.js";
import { ToolDef } from "../types.js";

export class ToolRegistry {
  private tools: ToolDef[] = [];
  private fingerprint = "";

  async refresh(schemaInput: string, service = "api") {
    const doc = await loadOpenApiSchema(schemaInput);
    const nextTools = compileTools(doc, service);
    const nextFingerprint = hash(nextTools);
    const changed = nextFingerprint !== this.fingerprint;
    this.tools = nextTools;
    this.fingerprint = nextFingerprint;
    return { changed, count: this.tools.length, fingerprint: this.fingerprint };
  }

  list() {
    return this.tools;
  }

  get(name: string) {
    return this.tools.find((t) => t.name === name);
  }
}

function hash(v: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(v)).digest("hex");
}
