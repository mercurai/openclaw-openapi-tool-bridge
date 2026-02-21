import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_INDEX_URL = "https://api.apis.guru/v2/list.json";

export interface CatalogEntry {
  id: string;
  title?: string;
  preferredVersion?: string;
  versions: Record<string, { swaggerUrl?: string; openapiUrl?: string; info?: { title?: string } }>;
}

export async function syncCatalog(outFile: string, indexUrl = DEFAULT_INDEX_URL) {
  const res = await fetch(indexUrl);
  if (!res.ok) throw new Error(`Catalog sync failed: ${res.status}`);
  const json = await res.json();
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(json), "utf8");
  return { count: Object.keys(json).length, outFile };
}

export async function loadCatalog(file: string): Promise<Record<string, CatalogEntry>> {
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw);
}

export function selectSchemaUrl(entry: CatalogEntry, version?: string): string {
  const v = version ?? entry.preferredVersion ?? Object.keys(entry.versions)[0];
  const ver = entry.versions[v];
  if (!ver) throw new Error(`Version not found: ${v}`);
  const url = ver.openapiUrl ?? ver.swaggerUrl;
  if (!url) throw new Error(`No schema URL found for version ${v}`);
  return url;
}

export function listCatalog(catalog: Record<string, CatalogEntry>, limit = 50): Array<{ id: string; title: string }> {
  return Object.entries(catalog)
    .slice(0, limit)
    .map(([id, e]) => {
      const pv = e.preferredVersion ?? Object.keys(e.versions ?? {})[0];
      const title = e.title || (pv ? e.versions?.[pv]?.info?.title : undefined) || id;
      return { id, title };
    });
}
