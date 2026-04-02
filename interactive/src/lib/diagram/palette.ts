import styles from "virtual:styles"; // virtual module derived from data/styles.yml

export interface ColorPair {
  stroke: string;
  fill: string;
}

const { palette, fills, roles } = styles;

const _warnedNames = new Set<string>();

/** Resolve a role name, palette color, or hex string to {stroke, fill}. */
export function resolve(name: string | undefined): ColorPair {
  if (!name) return { stroke: palette.grey, fill: palette.grey + "40" };
  const base = roles[name] || name;
  const s = palette[base];
  if (s) return { stroke: s, fill: fills[base] || s + "40" };
  // Raw hex or CSS color — pass through, but warn if it doesn't look like one
  if (!name.startsWith("#") && !name.startsWith("rgb") && !_warnedNames.has(name)) {
    console.warn(`[palette] unknown role/color '${name}' — passing through as raw CSS`);
    _warnedNames.add(name);
  }
  return { stroke: name, fill: name + "40" };
}
