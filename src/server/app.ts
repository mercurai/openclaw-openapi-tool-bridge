import express from "express";
import { ToolRegistry } from "../core/registry.js";
import { invokeTool } from "../core/executor.js";
import { toOpenClawManifest } from "../adapters/openclaw-manifest.js";
import { AuthProfile } from "../types.js";

export async function createApp(opts: {
  schema: string;
  service: string;
  auth: AuthProfile;
}) {
  const app = express();
  app.use(express.json());

  const registry = new ToolRegistry();
  await registry.refresh(opts.schema, opts.service);

  app.get("/health", (_req, res) => res.json({ ok: true, tools: registry.list().length }));

  app.get("/tools", (_req, res) => {
    res.json(toOpenClawManifest(registry.list(), opts.service));
  });

  app.post("/refresh", async (_req, res) => {
    const r = await registry.refresh(opts.schema, opts.service);
    res.json({ ok: true, ...r });
  });

  app.post("/invoke/:name", async (req, res) => {
    const tool = registry.get(req.params.name);
    if (!tool) return res.status(404).json({ ok: false, error: "Tool not found" });
    const result = await invokeTool(tool, req.body ?? {}, opts.auth);
    res.status(result.ok ? 200 : 502).json(result);
  });

  return app;
}
