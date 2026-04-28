import { describe, it } from "vitest";
import data from "../data.json";

// Test scaffold for the parameter calculator. All cases are it.todo until
// formulas.ts is calibrated against a real graphids run; see spec.md §Status.

describe("formulas — anchor tests", () => {
  // Each preset's compute(preset.knobs).total must land within ±20 % of the
  // paper-claimed total (or the calibrated graphids-measured total, once
  // available). Tolerance encodes the "estimate, not spec" framing.
  const cases: [string, number, number][] = [
    ["Deployed GAT student", 55_000, 0.2],
    ["Deployed GAT teacher", 1_100_000, 0.2],
    ["Deployed VGAE student", 86_000, 0.2],
    ["Deployed VGAE teacher", 1_710_000, 0.2],
    ["Deployed Fusion student", 32_000, 0.25],
    ["Deployed Fusion teacher", 687_000, 0.25],
  ];
  for (const [name, claimed, tol] of cases) {
    it.todo(`${name} within ±${tol * 100}% of ${claimed}`);
  }
});

describe("formulas — monotonicity", () => {
  it.todo("GAT params grow with hidden width");
  it.todo("GAT params grow with layer count");
  it.todo("VGAE params grow with latent dim (last entry of schedule)");
  it.todo("Fusion params grow with hidden width");
});

describe("formulas — internal consistency", () => {
  it.todo("breakdown sums to total for every preset");
});

describe("formulas — ensemble composition", () => {
  it.todo("computeEnsemble.total equals computeGat + computeVgae + computeFusion totals");
  it.todo("computeEnsemble.flops equals sum of component flops");
  it.todo("computeEnsemble.uncertainty equals TOLERANCE.ensemble");
});

// Sanity: data.json loads, component presets are well-typed, and every
// ensemble preset's component refs resolve.
describe("data.json — preset shape", () => {
  it("each component preset has a knobs.model tag", () => {
    for (const p of data.presets) {
      if (!["gat", "vgae", "fusion"].includes(p.knobs.model)) {
        throw new Error(`preset "${p.name}" has invalid model tag`);
      }
    }
  });

  it("each ensemble preset references three valid component presets", () => {
    const presetNames = new Set(data.presets.map((p) => p.name));
    for (const e of data.ensemble_presets) {
      if (e.components.length !== 3) {
        throw new Error(
          `ensemble "${e.name}" must have 3 components, got ${e.components.length}`,
        );
      }
      for (const ref of e.components) {
        if (!presetNames.has(ref)) {
          throw new Error(
            `ensemble "${e.name}" references missing component preset "${ref}"`,
          );
        }
      }
    }
  });
});
