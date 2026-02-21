import { OpenApiDoc, ToolDef } from "../types.js";

const METHODS = ["get", "post", "put", "patch", "delete"] as const;

export function compileTools(doc: OpenApiDoc, service = "api"): ToolDef[] {
  const serverUrl = doc.servers?.[0]?.url ?? "http://localhost";
  const tools: ToolDef[] = [];

  for (const [route, ops] of Object.entries(doc.paths)) {
    for (const method of METHODS) {
      const spec = ops?.[method];
      if (!spec) continue;
      const operationId = spec.operationId || buildOperationId(method, route);
      const name = `openapi.${service}.${sanitize(operationId)}`;
      tools.push({
        name,
        description: spec.summary || spec.description || `${method.toUpperCase()} ${route}`,
        method,
        path: route,
        serverUrl,
        operationId,
        tags: spec.tags ?? [],
        parametersSchema: buildParameterSchema(spec.parameters ?? []),
        requestBodySchema: spec.requestBody?.content?.["application/json"]?.schema,
        responses: spec.responses ?? {},
      });
    }
  }

  return dedupeNames(tools);
}

function buildOperationId(method: string, route: string): string {
  return `${method}_${route.replace(/\{(.*?)\}/g, "$1").replace(/[^a-zA-Z0-9]+/g, "_")}`;
}

function sanitize(s: string): string {
  return s.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function buildParameterSchema(parameters: any[]): any {
  const properties: Record<string, any> = {};
  const required: string[] = [];
  for (const p of parameters) {
    if (!p?.name) continue;
    properties[p.name] = p.schema ?? { type: "string" };
    if (p.required) required.push(p.name);
  }
  return { type: "object", properties, required };
}

function dedupeNames(tools: ToolDef[]): ToolDef[] {
  const seen = new Map<string, number>();
  return tools.map((t) => {
    const n = seen.get(t.name) ?? 0;
    seen.set(t.name, n + 1);
    if (n === 0) return t;
    return { ...t, name: `${t.name}_${n + 1}` };
  });
}
