export type OutputFormat = "json" | "md" | "table";

export interface OutputEnvelope<T = unknown> {
  ok: boolean;
  command: string;
  data: T | null;
  error: { code: string; message: string; details?: unknown } | null;
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

export function envelopeErr(command: string, code: string, message: string, details?: unknown): OutputEnvelope<null> {
  return {
    ok: false,
    command,
    data: null,
    error: { code, message, details },
    meta: { schemaVersion: "cli.v1", timestamp: new Date().toISOString() },
  };
}

export function printOut(v: unknown, format: OutputFormat = "json") {
  if (format === "json") return console.log(JSON.stringify(v, null, 2));
  if (format === "md") return console.log("```json\n" + JSON.stringify(v, null, 2) + "\n```");
  console.log(JSON.stringify(v, null, 2));
}
