#!/usr/bin/env node
import { Command } from "commander";
import { loadOpenApiSchema } from "./core/schema-loader.js";
import { compileTools } from "./core/compiler.js";
import { toOpenClawManifest } from "./adapters/openclaw-manifest.js";
import { createApp } from "./server/app.js";
import fs from "node:fs/promises";
import path from "node:path";
import { normalizeOpenApi } from "./integrations/oas-normalizer.js";
import { listCatalog, loadCatalog, selectSchemaUrl, syncCatalog } from "./catalog/apis-guru.js";
import { runPythonOpenApiValidator } from "./validators/python-openapi.js";
import { runBumpDiff } from "./diff/bump.js";

const program = new Command();
program.name("openapi-bridge").description("OpenAPI to tool bridge for OpenClaw");

program
  .command("inspect")
  .requiredOption("-s, --schema <pathOrUrl>")
  .option("--service <name>", "service name", "api")
  .action(async (opts) => {
    const doc = await loadOpenApiSchema(opts.schema);
    const tools = compileTools(doc, opts.service);
    console.log(JSON.stringify({ count: tools.length, tools: tools.map((t) => t.name) }, null, 2));
  });

program
  .command("manifest")
  .requiredOption("-s, --schema <pathOrUrl>")
  .option("--service <name>", "service name", "api")
  .option("-o, --out <file>")
  .action(async (opts) => {
    const doc = await loadOpenApiSchema(opts.schema);
    const tools = compileTools(doc, opts.service);
    const manifest = toOpenClawManifest(tools, opts.service);
    const json = JSON.stringify(manifest, null, 2);
    if (opts.out) {
      await fs.writeFile(opts.out, json, "utf8");
      console.log(`wrote ${opts.out}`);
    } else {
      console.log(json);
    }
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
    } else {
      console.log(json);
    }
  });

program
  .command("validate")
  .requiredOption("-s, --schema <pathOrUrl>")
  .option("--python-strict", "also run python-openapi-spec-validator when schema is local file")
  .action(async (opts) => {
    const normalized = await normalizeOpenApi(opts.schema, true);
    console.log(`oas-normalize: ok (openapi=${normalized.openapi || 'unknown'})`);
    if (opts.pythonStrict && !/^https?:\/\//.test(opts.schema)) {
      const r = runPythonOpenApiValidator(opts.schema);
      if (!r.ok) {
        console.error(`python validator failed: ${r.stderr || r.stdout}`);
        process.exitCode = 1;
      } else {
        console.log("python-openapi-spec-validator: ok");
      }
    }
  });

const catalog = program.command("catalog").description("APIs.guru catalog operations");

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
  .requiredOption("-a, --api <id>", "api id from catalog")
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

program.parseAsync();
