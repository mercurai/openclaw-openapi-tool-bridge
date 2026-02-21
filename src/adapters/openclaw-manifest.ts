import { ToolDef } from "../types.js";

export interface OpenClawToolManifest {
  namespace: string;
  generatedAt: string;
  tools: Array<{
    name: string;
    description: string;
    inputSchema: any;
  }>;
}

export function toOpenClawManifest(tools: ToolDef[], namespace = "openapi"): OpenClawToolManifest {
  return {
    namespace,
    generatedAt: new Date().toISOString(),
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: {
        type: "object",
        properties: {
          parameters: t.parametersSchema ?? { type: "object", properties: {} },
          requestBody: t.requestBodySchema ?? { type: "object" },
        },
      },
    })),
  };
}
