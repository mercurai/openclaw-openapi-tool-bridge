#!/usr/bin/env node
import { Command } from "commander";
import { loadOpenApiSchema } from "./core/schema-loader.js";
import { compileTools } from "./core/compiler.js";
import { toOpenClawManifest } from "./adapters/openclaw-manifest.js";
import { createApp } from "./server/app.js";
import fs from "node:fs/promises";

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

program.parseAsync();
