/**
 * Spatial assertion engine for diagram layout verification.
 *
 * Builds a unified index from FlatData, parses Galen-inspired assertion strings,
 * and checks spatial predicates (left-of, above, aligned, inside, etc.).
 *
 * Usage:
 *   const results = checkSpatial(flatData, [
 *     'vgae_t: left-of gat_t',
 *     'vgae_t: above vgae_s 80 to 250',
 *   ]);
 */

import type { FlatData, FlatNode, FlatBox, FlatContainer } from './flatten.ts';

// --- Spatial element (unified lookup target) ---

export interface SpatialElement {
  id: string;
  x: number;
  y: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  kind: 'node' | 'box' | 'container';
}

// --- Parsed assertion ---

export type Predicate =
  | 'left-of'
  | 'right-of'
  | 'above'
  | 'below'
  | 'aligned-horizontally'
  | 'aligned-vertically'
  | 'inside';

export interface ParsedAssertion {
  subject: string;
  predicate: Predicate;
  object: string;
  min?: number;
  max?: number;
}

// --- Result ---

export interface AssertionResult {
  assertion: string;
  passed: boolean;
  detail: string;
}

// --- Index builder ---

/**
 * Build a unified lookup map from FlatData for spatial assertion checking.
 *
 * - FlatNode: keyed by `id`
 * - FlatBox: keyed by `id`
 * - FlatContainer: keyed by `group` (containers lack `id`)
 * - Graph clusters: if `prefixMap` provided, computes centroid of nodes
 *   matching the prefix and registers under the mapped key.
 *   e.g. `{ input: 'in' }` → centroid of all `in_*` nodes → keyed as `input`
 */
export function buildSpatialIndex(
  data: FlatData,
  prefixMap?: Record<string, string>,
): Map<string, SpatialElement> {
  const index = new Map<string, SpatialElement>();

  for (const node of data.nodes) {
    index.set(node.id, {
      id: node.id,
      x: node.x,
      y: node.y,
      kind: 'node',
    });
  }

  for (const box of data.boxes) {
    index.set(box.id, {
      id: box.id,
      x: box.x,
      y: box.y,
      x1: box.x1,
      y1: box.y1,
      x2: box.x2,
      y2: box.y2,
      kind: 'box',
    });
  }

  for (const container of data.containers) {
    const cx = (container.x1 + container.x2) / 2;
    const cy = (container.y1 + container.y2) / 2;
    index.set(container.group, {
      id: container.group,
      x: cx,
      y: cy,
      x1: container.x1,
      y1: container.y1,
      x2: container.x2,
      y2: container.y2,
      kind: 'container',
    });
  }

  // Graph cluster centroids via prefix map
  if (prefixMap) {
    for (const [specId, prefix] of Object.entries(prefixMap)) {
      const matching = data.nodes.filter(n => n.id.startsWith(`${prefix}_`));
      if (matching.length === 0) continue;
      const cx = matching.reduce((s, n) => s + n.x, 0) / matching.length;
      const cy = matching.reduce((s, n) => s + n.y, 0) / matching.length;
      const xs = matching.map(n => n.x);
      const ys = matching.map(n => n.y);
      index.set(specId, {
        id: specId,
        x: cx,
        y: cy,
        x1: Math.min(...xs),
        y1: Math.min(...ys),
        x2: Math.max(...xs),
        y2: Math.max(...ys),
        kind: 'node',
      });
    }
  }

  return index;
}

// --- Assertion parser ---

const PREDICATES: Predicate[] = [
  'aligned-horizontally',
  'aligned-vertically',
  'left-of',
  'right-of',
  'above',
  'below',
  'inside',
];

/**
 * Parse "subject: predicate object [N to M]" into a structured assertion.
 *
 * Examples:
 *   "vgae_t: left-of gat_t"
 *   "vgae_t: above vgae_s 80 to 250"
 *   "vgae_t: aligned-horizontally gat_t"
 */
export function parseAssertion(assertion: string): ParsedAssertion {
  const colonIdx = assertion.indexOf(':');
  if (colonIdx === -1) {
    throw new Error(`Invalid assertion (no colon): "${assertion}"`);
  }

  const subject = assertion.slice(0, colonIdx).trim();
  const rest = assertion.slice(colonIdx + 1).trim();

  // Find which predicate matches
  let predicate: Predicate | undefined;
  let afterPredicate = '';
  for (const p of PREDICATES) {
    if (rest.startsWith(p)) {
      predicate = p;
      afterPredicate = rest.slice(p.length).trim();
      break;
    }
  }
  if (!predicate) {
    throw new Error(`Unknown predicate in: "${assertion}"`);
  }

  // Parse "object [N to M]"
  const rangeMatch = afterPredicate.match(/^(\S+)\s+(\d+(?:\.\d+)?)\s+to\s+(\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    return {
      subject,
      predicate,
      object: rangeMatch[1],
      min: parseFloat(rangeMatch[2]),
      max: parseFloat(rangeMatch[3]),
    };
  }

  const parts = afterPredicate.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    throw new Error(`Missing object in: "${assertion}"`);
  }
  if (parts.length > 1) {
    throw new Error(`Unexpected tokens after object in: "${assertion}" (got: ${parts.slice(1).join(' ')})`);
  }

  return { subject, predicate, object: parts[0] };
}

// --- Predicate evaluation ---

function evalPredicate(
  a: SpatialElement,
  b: SpatialElement,
  parsed: ParsedAssertion,
  tolerance: number,
): AssertionResult {
  const { predicate, min, max } = parsed;
  const assertion = `${parsed.subject}: ${predicate} ${parsed.object}${min != null ? ` ${min} to ${max}` : ''}`;

  switch (predicate) {
    case 'left-of': {
      const gap = b.x - a.x;
      if (min != null && max != null) {
        const passed = gap >= min && gap <= max;
        return { assertion, passed, detail: `gap=${gap.toFixed(1)}, expected ${min} to ${max}` };
      }
      const passed = a.x < b.x;
      return { assertion, passed, detail: `${a.id}.x=${a.x.toFixed(1)}, ${b.id}.x=${b.x.toFixed(1)}` };
    }

    case 'right-of': {
      const gap = a.x - b.x;
      if (min != null && max != null) {
        const passed = gap >= min && gap <= max;
        return { assertion, passed, detail: `gap=${gap.toFixed(1)}, expected ${min} to ${max}` };
      }
      const passed = a.x > b.x;
      return { assertion, passed, detail: `${a.id}.x=${a.x.toFixed(1)}, ${b.id}.x=${b.x.toFixed(1)}` };
    }

    case 'above': {
      const gap = b.y - a.y;
      if (min != null && max != null) {
        const passed = gap >= min && gap <= max;
        return { assertion, passed, detail: `gap=${gap.toFixed(1)}, expected ${min} to ${max}` };
      }
      const passed = a.y < b.y;
      return { assertion, passed, detail: `${a.id}.y=${a.y.toFixed(1)}, ${b.id}.y=${b.y.toFixed(1)}` };
    }

    case 'below': {
      const gap = a.y - b.y;
      if (min != null && max != null) {
        const passed = gap >= min && gap <= max;
        return { assertion, passed, detail: `gap=${gap.toFixed(1)}, expected ${min} to ${max}` };
      }
      const passed = a.y > b.y;
      return { assertion, passed, detail: `${a.id}.y=${a.y.toFixed(1)}, ${b.id}.y=${b.y.toFixed(1)}` };
    }

    case 'aligned-horizontally': {
      const diff = Math.abs(a.y - b.y);
      const passed = diff <= tolerance;
      return { assertion, passed, detail: `|Δy|=${diff.toFixed(1)}, tolerance=${tolerance}` };
    }

    case 'aligned-vertically': {
      const diff = Math.abs(a.x - b.x);
      const passed = diff <= tolerance;
      return { assertion, passed, detail: `|Δx|=${diff.toFixed(1)}, tolerance=${tolerance}` };
    }

    case 'inside': {
      if (b.x1 == null || b.y1 == null || b.x2 == null || b.y2 == null) {
        return { assertion, passed: false, detail: `${b.id} has no bounds` };
      }
      if (a.x1 != null && a.y1 != null && a.x2 != null && a.y2 != null) {
        // Bounded inside bounded
        const passed = a.x1 >= b.x1 && a.y1 >= b.y1 && a.x2 <= b.x2 && a.y2 <= b.y2;
        return { assertion, passed, detail: `a=[${a.x1.toFixed(0)},${a.y1.toFixed(0)},${a.x2.toFixed(0)},${a.y2.toFixed(0)}] b=[${b.x1.toFixed(0)},${b.y1.toFixed(0)},${b.x2.toFixed(0)},${b.y2.toFixed(0)}]` };
      }
      // Point inside bounded
      const passed = a.x >= b.x1 && a.x <= b.x2 && a.y >= b.y1 && a.y <= b.y2;
      return { assertion, passed, detail: `point=(${a.x.toFixed(1)},${a.y.toFixed(1)}) bounds=[${b.x1.toFixed(0)},${b.y1.toFixed(0)},${b.x2.toFixed(0)},${b.y2.toFixed(0)}]` };
    }
  }
}

// --- Main check function ---

export interface CheckSpatialOptions {
  tolerance?: number;
  prefixMap?: Record<string, string>;
}

/**
 * Run all spatial assertions against FlatData.
 * Returns an array of results (one per assertion). Empty failures array = all passed.
 */
export function checkSpatial(
  data: FlatData,
  assertions: string[],
  opts: CheckSpatialOptions = {},
): AssertionResult[] {
  const { tolerance = 5, prefixMap } = opts;
  const index = buildSpatialIndex(data, prefixMap);
  const results: AssertionResult[] = [];

  for (const raw of assertions) {
    const parsed = parseAssertion(raw);

    const a = index.get(parsed.subject);
    const b = index.get(parsed.object);

    if (!a) {
      results.push({ assertion: raw, passed: false, detail: `element '${parsed.subject}' not found in spatial index` });
      continue;
    }
    if (!b) {
      results.push({ assertion: raw, passed: false, detail: `element '${parsed.object}' not found in spatial index` });
      continue;
    }

    results.push(evalPredicate(a, b, parsed, tolerance));
  }

  return results;
}
