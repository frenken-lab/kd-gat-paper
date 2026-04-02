# Figure Data Contracts

Each data-driven figure imports `data.json` at build time (inlined by vite-plugin-singlefile). This document defines the expected schema for each figure's data, what the current placeholder data provides, and what changes when rich KD-GAT exports arrive.

All figures handle empty data gracefully: `[]` or `{}` shows "Awaiting data export from KD-GAT".

---

## umap

**File:** `src/figures/umap/data.json`

**Schema:** Array of records.

| Field | Type | Description |
|-------|------|-------------|
| `x` | float | UMAP dimension 1 |
| `y` | float | UMAP dimension 2 |
| `attack_type` | string | Category label (used for color + toggle filter) |
| `label` | int | Binary ground truth (0=normal, 1=attack). **Not currently rendered.** |

**Current data:** 500 records, 2 categories: `"Normal"`, `"Attack"`.

**Rich data:** Same schema, but `attack_type` expands to per-class labels (e.g., `"Normal"`, `"DoS"`, `"Fuzzy"`, `"Gear"`, `"RPM"`). Color domain and toggle buttons adapt automatically (derived from data). Up to 7 distinct types use unique palette colors; beyond 7, colors cycle.

**When new data arrives:** Drop in `data.json`. No component changes needed.

---

## fusion

**File:** `src/figures/fusion/data.json`

**Schema:** Array of records.

| Field | Type | Description |
|-------|------|-------------|
| `alpha` | float (0–1) | Bandit fusion weight (0 = pure VGAE, 1 = pure GAT) |
| `attack_type` | string | Category label (used for color + toggle filter) |
| `label` | int | Binary ground truth. **Not currently rendered.** |

**Current data:** 1,873 records, 2 categories: `"Normal"`, `"Attack"`.

**Rich data:** Same schema, `attack_type` may expand to per-class labels. Domain derived from data.

**When new data arrives:** Drop in `data.json`. No component changes needed.

---

## reconstruction

**File:** `src/figures/reconstruction/data.json`

**Schema:** Object with three keys.

### `kde` — Component error distributions
| Field | Type | Description |
|-------|------|-------------|
| `value` | float | Reconstruction error value |
| `component` | string | Error component name |
| `class` | string | `"normal"` or `"attack"` (used as facet `fy`) |

### `heatmap` — Error summary grid
| Field | Type | Description |
|-------|------|-------------|
| `row` | string | Row label (e.g., graph group ID) |
| `component` | string | Component name |
| `value` | float | Aggregated error value |

### `roc` — Per-component ROC curves
| Field | Type | Description |
|-------|------|-------------|
| `fpr` | float (0–1) | False positive rate |
| `tpr` | float (0–1) | True positive rate |
| `component` | string | Component name |

**Current data:** 4 components: `"Node Recon"`, `"CAN ID"`, `"Neighbor"`, `"KL"`. 3 heatmap rows. 2 classes.

**Rich data:** May add/rename components (e.g., `"Edge Recon"`, `"Degree"`). Component names must be consistent across all three sub-arrays (`kde`, `heatmap`, `roc`). Color domain and toggle buttons adapt automatically (derived from `kde` components). Up to 7 components use unique palette colors.

**When new data arrives:** Drop in `data.json`. Ensure component name strings are identical across `kde`, `heatmap`, and `roc` arrays. No component changes needed.

---

## attention

**File:** `src/figures/attention/data.json`

**Schema:** Array of graph objects.

### Per graph
| Field | Type | Description |
|-------|------|-------------|
| `graph_idx` | int | Graph identifier |
| `label` | int (0 or 1) | Graph-level label (colors all nodes) |
| `attack_type` | string | Display label (shown in dropdown + metadata) |
| `nodes` | array | Node objects |
| `edges` | array | Edge objects |

### Per node
| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Node index |
| `can_id` | string | CAN bus ID (text label above dot) |
| `x` | float | Layout x position |
| `y` | float | Layout y position |

### Per edge
| Field | Type | Description |
|-------|------|-------------|
| `source` | int | Source node index |
| `target` | int | Target node index |
| `layer_N_attention` | float | Attention weight for layer N (auto-discovered via regex) |

**Current data:** 10 graphs (5 Normal, 5 Attack), 32 nodes/graph, 51 edges/graph, 3 attention layers (`layer_0`, `layer_1`, `layer_2`).

**Rich data:** More graphs, possibly more layers. Layer count auto-discovered from `data[0].edges[0]` key names matching `/^layer_\d+_attention$/`. Graph count drives the dropdown.

**Known limitation:** Node fill is binary — `label === 1 ? attack : normal`. If graph labels become multi-class ints, anything != 1 renders as normal. To support multi-class: change to a lookup from `attack_type` string (same pattern as umap/fusion).

**When new data arrives:** Drop in `data.json`. If attack types go multi-class, update line 70 to use a data-driven color map instead of binary branch.

---

## cka

**File:** `src/figures/cka/data.json`

**Schema:** Object.

| Field | Type | Description |
|-------|------|-------------|
| `matrix` | float[][] | CKA similarity values (rows=teacher, cols=student) |
| `teacher_layers` | string[] | Row labels |
| `student_layers` | string[] | Column labels |

**Current data:** 3×2 matrix. Values: 0.927–0.992.

**Rich data:** Larger matrices (e.g., 6 teacher × 3 student layers). Matrix dimensions must match `teacher_layers.length × student_layers.length`. Component adapts automatically — band scales use the label arrays directly.

**Known limitations:**
- Text color threshold `> 0.7 → white` is hardcoded (acceptable for 0–1 CKA values)
- Color scale auto-ranges to data min/max (no `[0, 1]` clamp) — narrow ranges overstate contrast

**When new data arrives:** Drop in `data.json`. No component changes needed.

---

## Checklist: When Rich Data Arrives

1. Run new KD-GAT export → produces updated `data.json` files
2. Copy each into `interactive/src/figures/<name>/data.json`
3. Verify category strings are consistent within each figure (especially reconstruction's 3 sub-arrays)
4. `cd interactive && npm run build` — figures rebuild with inlined data
5. Spot-check: if attention needs multi-class node colors, update `attention/App.svelte:70`
6. `npm test` — existing tests still pass (they don't depend on data.json content)
7. Commit + push → CI deploys to both GitHub Pages and curve.space
