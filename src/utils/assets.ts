/** Map of asset id → base64 data URL. */
export type AssetMap = Record<string, string>;

/**
 * Replace `asset://<id>` placeholders (which the model emits, keeping stored
 * HTML lean) with the real base64 data URL — done only at render/export time.
 */
export function resolveAssets(html: string, assets: AssetMap): string {
  if (!html) return html;
  return html.replace(
    /asset:\/\/([A-Za-z0-9_-]+)/g,
    (m, id) => assets[id] ?? m,
  );
}
