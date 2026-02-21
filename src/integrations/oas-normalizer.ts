import OASNormalize from "oas-normalize";

export async function normalizeOpenApi(input: string, convertToLatest = true): Promise<any> {
  const oas = new OASNormalize(input, { enablePaths: true });
  return await oas.validate({ convertToLatest });
}
