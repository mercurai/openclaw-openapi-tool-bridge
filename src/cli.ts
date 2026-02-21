#!/usr/bin/env node
import { Command } from "commander";
import fs from "node:fs/promises";
import path from "node:path";
import { createApp } from "./server/app.js";
import { toOpenClawManifest } from "./adapters/openclaw-manifest.js";
import { runBumpDiff } from "./diff/bump.js";
import { listCatalog, loadCatalog, selectSchemaUrl, syncCatalog } from "./catalog/apis-guru.js";
import { normalizeOpenApi } from "./integrations/oas-normalizer.js";
import { runPythonOpenApiValidator } from "./validators/python-openapi.js";
import { getActiveContext, useSchema } from "./core/context.js";
import { envelope, envelopeErr, printOut, OutputFormat } from "./core/output.js";
import { invokeTool } from "./core/executor.js";
import { loadState } from "./core/state-manager.js";

const program = new Command();
program
  .name("openapi-bridge")
  .description("OpenAPI to tool bridge for OpenClaw")
  .addHelpText(
    "after",
    `\nPrimary workflow:\n  openapi-bridge use <schema-url|api-id|local-file> [--service billing]\n  openapi-bridge list --format json\n  openapi-bridge show <endpoint>\n  openapi-bridge run <endpoint> --param k=v --body @body.json\n  openapi-bridge <endpoint> --param k=v   # shorthand run\n`,
  );

function parseParams(values: string[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const v of values) {
    const i = v.indexOf("=");
    if (i <= 0) continue;
    const k = v.slice(0, i);
    const val = v.slice(i + 1);
    out[k] = val;
  }
  return out;
}

async function readBody(body?: string): Promise<any> {
  if (!body) return undefined;
  if (body.startsWith("@")) {
    const raw = await fs.readFile(path.resolve(body.slice(1)), "utf8");
    return JSON.parse(raw);
  }
  return JSON.parse(body);
}

program
  .command("use")
  .argument("<target>")
  .option("--service <name>", "service name", "api")
  .option("--format <fmt>", "json|md|table", "json")
  .action(async (target, opts) => {
    try {
      const ctx = await useSchema(target, opts.service);
      printOut(envelope("use", { service: ctx.service, fingerprint: ctx.fingerprint, tools: ctx.tools.length }), opts.format as OutputFormat);
    } catch (e: any) {
      printOut(envelopeErr("use", "USE_FAILED", e.message), opts.format as OutputFormat);
      process.exitCode = 1;
    }
  });

program
  .command("list")
  .option("--format <fmt>", "json|md|table", "json")
  .action(async (opts) => {
    try {
      const ctx = await getActiveContext();
      const data = ctx.tools.map((t) => ({ name: t.name, method: t.method.toUpperCase(), path: t.path, description: t.description }));
      printOut(envelope("list", data, { service: ctx.service, schemaFingerprint: ctx.fingerprint }), opts.format as OutputFormat);
    } catch (e: any) {
      printOut(envelopeErr("list", "NO_ACTIVE_CONTEXT", e.message), opts.format as OutputFormat);
      process.exitCode = 1;
    }
  });

program
  .command("show")
  .argument("<endpoint>")
  .option("--format <fmt>", "json|md|table", "json")
  .action(async (endpoint, opts) => {
    try {
      const ctx = await getActiveContext();
      const tool = ctx.tools.find((t) => t.name === endpoint || t.name.endsWith(`.${endpoint}`));
      if (!tool) throw new Error(`Endpoint not found: ${endpoint}`);
      const data = {
        name: tool.name,
        method: tool.method,
        path: tool.path,
        description: tool.description,
        parametersSchema: tool.parametersSchema ?? {},
        requestBodySchema: tool.requestBodySchema ?? null,
        responses: tool.responses ?? {},
      };
      printOut(envelope("show", data, { service: ctx.service, schemaFingerprint: ctx.fingerprint }), opts.format as OutputFormat);
    } catch (e: any) {
      printOut(envelopeErr("show", "SHOW_FAILED", e.message), opts.format as OutputFormat);
      process.exitCode = 1;
    }
  });

program
  .command("run")
  .argument("<endpoint>")
  .option("--param <k=v>", "request parameter", (v, p: string[]) => (p ? [...p, v] : [v]), [])
  .option("--body <jsonOr@file>")
  .option("--format <fmt>", "json|md|table", "json")
  .action(async (endpoint, opts) => {
    try {
      const ctx = await getActiveContext();
      const tool = ctx.tools.find((t) => t.name === endpoint || t.name.endsWith(`.${endpoint}`));
      if (!tool) throw new Error(`Endpoint not found: ${endpoint}`);
      const parameters = parseParams(opts.param ?? []);
      const requestBody = await readBody(opts.body);
      const result = await invokeTool(tool, { parameters, requestBody });
      printOut(envelope("run", result, { endpoint: tool.name, service: ctx.service, schemaFingerprint: ctx.fingerprint }), opts.format as OutputFormat);
    } catch (e: any) {
      printOut(envelopeErr("run", "RUN_FAILED", e.message), opts.format as OutputFormat);
      process.exitCode = 1;
    }
  });

program
  .command("schemas")
  .option("--format <fmt>", "json|md|table", "json")
  .action(async (opts) => {
    const st = await loadState();
    printOut(envelope("schemas", st.active ? [st.active] : []), opts.format as OutputFormat);
  });

program
  .command("search")
  .argument("<query>")
  .option("--format <fmt>", "json|md|table", "json")
  .action(async (query, opts) => {
    try {
      const ctx = await getActiveContext();
      const q = String(query).toLowerCase();
      const data = ctx.tools.filter((t) => [t.name, t.description, t.path].join(" ").toLowerCase().includes(q));
      printOut(envelope("search", data, { service: ctx.service, schemaFingerprint: ctx.fingerprint }), opts.format as OutputFormat);
    } catch (e: any) {
      printOut(envelopeErr("search", "SEARCH_FAILED", e.message), opts.format as OutputFormat);
      process.exitCode = 1;
    }
  });

program
  .command("help-json")
  .description("Machine-readable help")
  .action(() => {
    printOut(
      envelope("help-json", {
        schemaVersion: "cli.v1",
        commands: ["use", "list", "show", "run", "schemas", "search", "help-json", "inspect", "manifest", "serve", "normalize", "validate", "catalog", "diff"],
      }),
      "json",
    );
  });

// advanced commands (kept)
program
  .command("inspect")
  .requiredOption("-s, --schema <pathOrUrl>")
  .option("--service <name>", "service name", "api")
  .action(async (opts) => {
    const ctx = await useSchema(opts.schema, opts.service);
    printOut(envelope("inspect", { count: ctx.tools.length, tools: ctx.tools.map((t) => t.name) }), "json");
  });

program
  .command("manifest")
  .requiredOption("-s, --schema <pathOrUrl>")
  .option("--service <name>", "service name", "api")
  .option("-o, --out <file>")
  .action(async (opts) => {
    const ctx = await useSchema(opts.schema, opts.service);
    const manifest = toOpenClawManifest(ctx.tools, opts.service);
    const json = JSON.stringify(manifest, null, 2);
    if (opts.out) {
      await fs.writeFile(opts.out, json, "utf8");
      console.log(`wrote ${opts.out}`);
    } else console.log(json);
  });

program
  .command("serve")
  .requiredOption("-s, --schema <pathOrUrl>")
  .option("--service <name>", "service name", "api")
  .option("--port <port>", "port", "8788")
  .option("--auth-type <type>", "none|bearer|apikey", "none")
  .option("--token <token>")
  .option("--header <header>")
  .option("--query-key <queryKey>")
  .option("--query-value <queryValue>")
  .action(async (opts) => {
    const app = await createApp({
      schema: opts.schema,
      service: opts.service,
      auth: {
        type: opts.authType,
        token: opts.token,
        header: opts.header,
        queryKey: opts.queryKey,
        queryValue: opts.queryValue,
      } as any,
    });
    const port = Number(opts.port);
    app.listen(port, () => console.log(`openapi-bridge listening on ${port}`));
  });

program
  .command("normalize")
  .requiredOption("-s, --schema <pathOrUrl>")
  .option("-o, --out <file>")
  .action(async (opts) => {
    const normalized = await normalizeOpenApi(opts.schema, true);
    const json = JSON.stringify(normalized, null, 2);
    if (opts.out) {
      await fs.writeFile(opts.out, json, "utf8");
      console.log(`wrote ${opts.out}`);
    } else console.log(json);
  });

program
  .command("validate")
  .requiredOption("-s, --schema <pathOrUrl>")
  .option("--python-strict", "also run python-openapi-spec-validator when schema is local file")
  .action(async (opts) => {
    const normalized = await normalizeOpenApi(opts.schema, true);
    console.log(`oas-normalize: ok (openapi=${normalized.openapi || "unknown"})`);
    if (opts.pythonStrict && !/^https?:\/\//.test(opts.schema)) {
      const r = runPythonOpenApiValidator(opts.schema);
      if (!r.ok) {
        console.error(`python validator failed: ${r.stderr || r.stdout}`);
        process.exitCode = 1;
      } else console.log("python-openapi-spec-validator: ok");
    }
  });

const catalog = program.command("catalog").description("Catalog operations");

catalog
  .command("sync")
  .option("-o, --out <file>", "output file", path.join(process.cwd(), ".cache/apis-guru-list.json"))
  .action(async (opts) => {
    const result = await syncCatalog(opts.out);
    console.log(JSON.stringify(result, null, 2));
  });

catalog
  .command("list")
  .option("-i, --index <file>", "catalog index file", path.join(process.cwd(), ".cache/apis-guru-list.json"))
  .option("-n, --limit <limit>", "number of entries", "50")
  .action(async (opts) => {
    const c = await loadCatalog(opts.index);
    const rows = listCatalog(c, Number(opts.limit));
    console.log(JSON.stringify(rows, null, 2));
  });

catalog
  .command("enable")
  .requiredOption("-a, --api <id>")
  .option("-v, --version <version>")
  .option("-i, --index <file>", "catalog index file", path.join(process.cwd(), ".cache/apis-guru-list.json"))
  .option("-o, --out <file>", "output bridge config", path.join(process.cwd(), "bridge.config.json"))
  .action(async (opts) => {
    const c = await loadCatalog(opts.index);
    const entry = c[opts.api];
    if (!entry) throw new Error(`API not found: ${opts.api}`);
    const schema = selectSchemaUrl(entry, opts.version);
    const cfg = { service: opts.api.replace(/[^a-zA-Z0-9_.-]/g, "_"), schema };
    await fs.writeFile(opts.out, JSON.stringify(cfg, null, 2), "utf8");
    console.log(`wrote ${opts.out}`);
    console.log(JSON.stringify(cfg, null, 2));
  });

program
  .command("diff")
  .requiredOption("--old <schema>")
  .requiredOption("--new <schema>")
  .action((opts) => {
    const r = runBumpDiff(opts.old, opts.new);
    if (!r.ok) {
      console.error(r.stderr || r.stdout);
      process.exitCode = 1;
      return;
    }
    console.log(r.stdout);
  });

// shorthand: openapi-bridge <endpoint> ... => run <endpoint> ...
program
  .argument("[endpoint]")
  .option("--param <k=v>", "request parameter", (v, p: string[]) => (p ? [...p, v] : [v]), [])
  .option("--body <jsonOr@file>")
  .option("--format <fmt>", "json|md|table", "json")
  .action(async (endpoint, opts) => {
    if (!endpoint) return;
    // ignore if endpoint equals built-in command (commander should catch commands first)
    try {
      const ctx = await getActiveContext();
      const tool = ctx.tools.find((t) => t.name === endpoint || t.name.endsWith(`.${endpoint}`));
      if (!tool) throw new Error(`Endpoint not found: ${endpoint}`);
      const parameters = parseParams(opts.param ?? []);
      const requestBody = await readBody(opts.body);
      const result = await invokeTool(tool, { parameters, requestBody });
      printOut(envelope("run", result, { endpoint: tool.name, service: ctx.service, schemaFingerprint: ctx.fingerprint }), opts.format as OutputFormat);
    } catch (e: any) {
      printOut(envelopeErr("run", "RUN_FAILED", e.message), opts.format as OutputFormat);
      process.exitCode = 1;
    }
  });

program.parseAsync();
