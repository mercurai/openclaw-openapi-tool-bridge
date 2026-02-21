export type OutputFormat = "json" | "md" | "table";

export type ErrorType = "VALIDATION_ERROR" | "CONTEXT_ERROR" | "POLICY_DENY" | "NETWORK_ERROR" | "UPSTREAM_ERROR" | "INTERNAL_ERROR";

export const ERROR_TYPE_MESSAGES: Record<ErrorType, string> = {
  VALIDATION_ERROR: "schema validation failed",
  CONTEXT_ERROR: "missing or invalid context",
  POLICY_DENY: "action denied by policy",
  NETWORK_ERROR: "network request failed",
  UPSTREAM_ERROR: "external API returned error",
  INTERNAL_ERROR: "unexpected internal error",
};

export interface OutputEnvelope<T = unknown> {
  ok: boolean;
  command: string;
  data: T | null;
  error: { type: ErrorType; code: string; message: string; details?: unknown } | null;
  meta: {
    schemaVersion: "cli.v1";
    timestamp: string;
    context?: Record<string, unknown>;
  };
}

export function envelope<T>(command: string, data: T, context?: Record<string, unknown>): OutputEnvelope<T> {
  return {
    ok: true,
    command,
    data,
    error: null,
    meta: { schemaVersion: "cli.v1", timestamp: new Date().toISOString(), context },
  };
}

export function envelopeErr(
  command: string,
  errorType: ErrorType,
  message: string,
  details?: unknown
): OutputEnvelope<null> {
  return {
    ok: false,
    command,
    data: null,
    error: { type: errorType, code: errorType, message, details },
    meta: { schemaVersion: "cli.v1", timestamp: new Date().toISOString() },
  };
}

export function printOut(v: unknown, format: OutputFormat = "json") {
  if (format === "json") return console.log(JSON.stringify(v, null, 2));
  if (format === "md") return console.log("```json\n" + JSON.stringify(v, null, 2) + "\n```");
  console.log(JSON.stringify(v, null, 2));
}
