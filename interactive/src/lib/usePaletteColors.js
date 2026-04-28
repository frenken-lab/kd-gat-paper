import { resolve } from "./flow/palette.ts";

/**
 * Default palette key order used across figures.
 * Keys are matched case-insensitively against category names;
 * unmatched categories fall back to positional assignment.
 */
const DEFAULT_PALETTE_KEYS = [
  "normal",
  "attack",
  "vgae",
  "gat",
  "dqn",
  "kd",
  "data",
  "attention",
];

/**
 * Builds a stable { category -> stroke color } map from a list of category
 * names, using the shared palette so every figure uses consistent colors.
 *
 * @param {string[]} categories - ordered list of unique category names
 * @param {string[]} [paletteKeys] - override the default key order
 * @returns {Record<string, string>} colorMap
 */
export function buildColorMap(categories, paletteKeys = DEFAULT_PALETTE_KEYS) {
  return Object.fromEntries(
    categories.map((cat, i) => {
      const match = paletteKeys.find((k) => k === cat.toLowerCase());
      const key = match ?? paletteKeys[i % paletteKeys.length];
      return [cat, resolve(key).stroke];
    }),
  );
}
