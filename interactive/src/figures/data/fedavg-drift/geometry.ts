/**
 * Analytic geometry for the FedAvg-drift figure.
 *
 * All computation lives here. App.svelte is a pure renderer — it imports
 * these functions, binds E from the slider, and maps results to marks.
 *
 * Model: each client has a quadratic local loss F_i(θ) = ‖θ − θᵢ*‖².
 * The global loss is a paraboloid centered at θ* (defined separately from
 * the mean of local minima to keep the geometry visually legible).
 *
 * The three client minima are placed in distinct quadrants so their drift
 * directions are geometrically irreconcilable — the core visual claim.
 */

export const DOMAIN: [number, number] = [-4, 4];

const α = 0.25; // learning rate (shared across all methods)
const μ = 1; // FedProx proximal coefficient
const ARROW_LEN = 1.8; // fixed display length for all server-update arrows

export const GLOBAL_MIN = { x: -2.0, y: -1.5 } as const; // θ*
export const ITERATE = { x: 0.8, y: 0.6 } as const; // θ^(t)

export interface ClientDef {
  name: string;
  lx: number; // local minimum x
  ly: number; // local minimum y
}

export const CLIENT_DEFS: ClientDef[] = [
  { name: 'Label shift', lx: -3.2, ly: 3.0 },
  { name: 'Feature shift', lx: 3.5, ly: 2.2 },
  { name: 'Concept shift', lx: 3.2, ly: -3.5 },
];

export interface Arrow2D {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ContourPoint {
  x: number;
  y: number;
  value: number;
}

/** Normalize an arrow to ARROW_LEN, preserving direction. */
function normalizeArrow(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): Arrow2D {
  const dx = x2 - x1,
    dy = y2 - y1;
  const mag = Math.sqrt(dx * dx + dy * dy);
  return {
    x1,
    y1,
    x2: x1 + (ARROW_LEN * dx) / mag,
    y2: y1 + (ARROW_LEN * dy) / mag,
  };
}

/** Global loss landscape: paraboloid centered at θ*. */
export function loss(x: number, y: number): number {
  return (x - GLOBAL_MIN.x) ** 2 + (y - GLOBAL_MIN.y) ** 2;
}

/** Pre-compute the contour grid once at module load. */
export function buildContourData(steps = 120): ContourPoint[] {
  const range = DOMAIN[1] - DOMAIN[0];
  const step = range / steps;
  const data: ContourPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    for (let j = 0; j <= steps; j++) {
      const x = DOMAIN[0] + i * step;
      const y = DOMAIN[0] + j * step;
      data.push({ x, y, value: loss(x, y) });
    }
  }
  return data;
}

/**
 * Per-client endpoint after E local gradient steps.
 *
 * Exact quadratic iterate:
 *   θᵢ(E) = θᵢ* + (θ^(t) − θᵢ*)(1−α)^E
 */
export function clientEndpointsAt(E: number): Array<{ x: number; y: number }> {
  const decay = (1 - α) ** E;
  return CLIENT_DEFS.map(c => ({
    x: c.lx + (ITERATE.x - c.lx) * decay,
    y: c.ly + (ITERATE.y - c.ly) * decay,
  }));
}

/**
 * FedAvg aggregate: unweighted mean of client endpoints (equal client sizes).
 * Converges to a stationary point of Σ(nᵢ/n)Fᵢ, not of F, under non-IID data.
 */
export function fedavgAt(E: number): Arrow2D {
  const pts = clientEndpointsAt(E);
  const n = pts.length;
  const x2 = pts.reduce((s, p) => s + p.x, 0) / n;
  const y2 = pts.reduce((s, p) => s + p.y, 0) / n;
  return normalizeArrow(ITERATE.x, ITERATE.y, x2, y2);
}

/**
 * FedProx aggregate: proximal penalty μ/2‖θ − θ^(t)‖² added to each local
 * objective pulls the effective local minimum toward θ^(t).
 *
 *   Effective min: wᵢ = (θᵢ* + μ·θ^(t)) / (1+μ)
 *   Iterate:       θᵢ_prox(E) = wᵢ + (θ^(t) − wᵢ)(1 − α(1+μ))^E
 *
 * Reduces drift vs FedAvg but does not eliminate it — the aggregate still
 * points toward the mean of shifted client minima, not toward θ*.
 */
export function fedproxAt(E: number): Arrow2D {
  const decayP = (1 - α * (1 + μ)) ** E;
  let sx = 0,
    sy = 0;
  for (const c of CLIENT_DEFS) {
    const wx = (c.lx + μ * ITERATE.x) / (1 + μ);
    const wy = (c.ly + μ * ITERATE.y) / (1 + μ);
    sx += wx + (ITERATE.x - wx) * decayP;
    sy += wy + (ITERATE.y - wy) * decayP;
  }
  const n = CLIENT_DEFS.length;
  return normalizeArrow(ITERATE.x, ITERATE.y, sx / n, sy / n);
}

/**
 * SCAFFOLD aggregate: per-client control variates correct each client's local
 * gradient toward the global gradient, eliminating drift.
 *
 * In the quadratic model, control variate cᵢ = ∇Fᵢ(θ^(t)) and the global
 * estimate c = ∇F(θ^(t)). The corrected local objective has its minimum at θ*
 * for every client — so the aggregate converges IID-like regardless of E.
 *
 *   θᵢ_scaffold(E) = θ* + (θ^(t) − θ*)(1−α)^E
 */
export function scaffoldAt(E: number): Arrow2D {
  const decay = (1 - α) ** E;
  const x2 = GLOBAL_MIN.x + (ITERATE.x - GLOBAL_MIN.x) * decay;
  const y2 = GLOBAL_MIN.y + (ITERATE.y - GLOBAL_MIN.y) * decay;
  return normalizeArrow(ITERATE.x, ITERATE.y, x2, y2);
}

/**
 * True gradient −∇F(θ^(t)): fixed-length arrow from θ^(t) toward θ*.
 * Reference direction — what a centralised gradient step would do.
 */
export function trueGradientArrow(): Arrow2D {
  return normalizeArrow(ITERATE.x, ITERATE.y, GLOBAL_MIN.x, GLOBAL_MIN.y);
}
