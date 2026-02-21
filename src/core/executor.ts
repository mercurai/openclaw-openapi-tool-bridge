import { AuthProfile, ToolDef } from "../types.js";

export async function invokeTool(
  tool: ToolDef,
  input: { parameters?: Record<string, any>; requestBody?: any },
  auth: AuthProfile = { type: "none" },
): Promise<any> {
  const params = input.parameters ?? {};
  const url = buildUrl(tool, params, auth);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth.type === "bearer" && auth.token) headers.Authorization = `Bearer ${auth.token}`;
  if (auth.type === "apikey" && auth.header && auth.token) headers[auth.header] = auth.token;

  const body = ["post", "put", "patch", "delete"].includes(tool.method)
    ? JSON.stringify(input.requestBody ?? null)
    : undefined;

  const res = await fetch(url, { method: tool.method.toUpperCase(), headers, body });
  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    return { ok: false, status: res.status, error: payload };
  }
  return { ok: true, status: res.status, data: payload };
}

function buildUrl(tool: ToolDef, params: Record<string, any>, auth: AuthProfile): string {
  let route = tool.path;
  const query = new URLSearchParams();

  for (const [k, v] of Object.entries(params)) {
    if (route.includes(`{${k}}`)) {
      route = route.replaceAll(`{${k}}`, encodeURIComponent(String(v)));
    } else if (v !== undefined && v !== null) {
      query.set(k, String(v));
    }
  }

  if (auth.type === "apikey" && auth.queryKey && auth.queryValue) {
    query.set(auth.queryKey, auth.queryValue);
  }

  const qs = query.toString();
  return `${tool.serverUrl}${route}${qs ? `?${qs}` : ""}`;
}
