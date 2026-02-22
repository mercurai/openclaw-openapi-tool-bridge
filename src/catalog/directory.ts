import fs from 'node:fs/promises';
import path from 'node:path';

export interface DirectoryEntry {
  id: string;
  title: string;
  version: string;
  openapi: string | null;
  schemaPath: string;
  sourceUrl?: string;
  updatedAt?: string;
}

export interface DirectoryCatalog {
  updatedAt: string;
  count: number;
  entries: DirectoryEntry[];
}

/**
 * Load catalog from openapi-schema-directory
 * Looks for bridge-catalog.json or index.json in the directory
 */
export async function loadDirectoryCatalog(dirPath: string): Promise<DirectoryCatalog | null> {
  const paths = [
    path.join(dirPath, 'catalog', 'bridge-catalog.json'),
    path.join(dirPath, 'catalog', 'index.json'),
    path.join(dirPath, '.cache', 'catalog', 'bridge-catalog.json'),
    path.join(dirPath, '.cache', 'catalog', 'index.json'),
  ];
  
  for (const p of paths) {
    try {
      const content = await fs.readFile(p, 'utf-8');
      const data = JSON.parse(content);
      
      // Handle both formats
      if (data.entries) {
        return { updatedAt: data.updatedAt, count: data.entries.length, entries: data.entries };
      }
      if (data.records) {
        return { 
          updatedAt: data.updatedAt, 
          count: data.records.length, 
          entries: data.records.map((r: any) => ({
            id: r.id,
            title: r.title,
            version: r.version,
            openapi: r.openapi,
            schemaPath: r.schemaPath || `/schemas/${r.id}/${r.version}.json`
          }))
        };
      }
      if (data.schemas) {
        return { updatedAt: data.updatedAt, count: data.schemas.length, entries: data.schemas };
      }
    } catch {
      // Try next path
    }
  }
  
  return null;
}

/**
 * List schemas from directory catalog
 */
export function listDirectoryCatalog(catalog: DirectoryCatalog, limit = 50): Array<{ id: string; title: string }> {
  return catalog.entries.slice(0, limit).map(e => ({
    id: e.id,
    title: e.title || e.id
  }));
}

/**
 * Find schema by ID in directory catalog
 */
export function findInDirectoryCatalog(catalog: DirectoryCatalog, id: string): DirectoryEntry | undefined {
  return catalog.entries.find(e => e.id === id);
}
