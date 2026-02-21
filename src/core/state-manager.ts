import fs from "node:fs/promises";
import path from "node:path";

export interface BridgeState {
  active?: {
    service: string;
    schemaInput: string;
    fingerprint: string;
    cacheFile: string;
    updatedAt: string;
  };
}

function stateDir(cwd = process.cwd()) {
  return path.join(cwd, ".openapi-bridge");
}

export function stateFile(cwd = process.cwd()) {
  return path.join(stateDir(cwd), "state.json");
}

export function cacheDir(cwd = process.cwd()) {
  return path.join(stateDir(cwd), "cache");
}

export async function loadState(cwd = process.cwd()): Promise<BridgeState> {
  try {
    const raw = await fs.readFile(stateFile(cwd), "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function saveState(next: BridgeState, cwd = process.cwd()): Promise<void> {
  await fs.mkdir(stateDir(cwd), { recursive: true });
  const tmp = `${stateFile(cwd)}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(next, null, 2) + "\n", "utf8");
  await fs.rename(tmp, stateFile(cwd));
}
