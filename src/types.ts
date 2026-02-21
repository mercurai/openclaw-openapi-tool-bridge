export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export interface OpenApiDoc {
  openapi: string;
  info?: { title?: string; version?: string };
  servers?: Array<{ url: string }>;
  paths: Record<string, Partial<Record<HttpMethod, any>>>;
}

export interface ToolDef {
  name: string;
  description: string;
  method: HttpMethod;
  path: string;
  serverUrl: string;
  operationId?: string;
  tags?: string[];
  parametersSchema?: any;
  requestBodySchema?: any;
  responses?: Record<string, any>;
}

export interface AuthProfile {
  type: "none" | "bearer" | "apikey";
  header?: string;
  token?: string;
  queryKey?: string;
  queryValue?: string;
}
