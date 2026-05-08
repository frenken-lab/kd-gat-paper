# GSN Diagram Diagnosis Report

**Figure**: `interactive/src/figures/diagrams/gsn-thesis/`  
**Built output**: `_build/figures/gsn-thesis.html` (1.7 MB, built 2026-05-07 17:49)  
**Method**: Playwright screenshot + DOM inspection at `http://127.0.0.1:7432/gsn-thesis.html`  
**Viewport transform at load**: `translate(29px, 187px) scale(0.298)` — diagram zooms to ~30% to fit

---

## Bug 1 — CRITICAL: All Strategy parallelograms render black

**Symptom**: Every parallelogram (Strategy node) has a solid black fill, making label text invisible.

**Root cause** (`App.svelte:76`):
```js
bgColor: `${color}40`,
```
Strategy nodes carry no `layer` field → `colorFor(undefined)` returns `'#888'` → concatenating `'40'` yields `'#88840'`, a **5-character hex string** (invalid). Browsers treat invalid SVG `fill` as black.

All 10 affected polygons confirmed via DOM inspection:
```html
<polygon fill="#88840" stroke="#888" .../>
```

**Fix**: Expand 3-char hex before appending the alpha suffix.

```ts
// App.svelte — replace colorFor fallback:
const colorFor = (layer: string | undefined): string =>
  (layer && LAYER_COLOR[layer]) || '#888888';
```

Or, if other figures might pass 3-char hex colors into this pattern elsewhere, a general helper:

```ts
const expandHex = (c: string) =>
  /^#[0-9a-f]{3}$/i.test(c) ? '#' + [...c.slice(1)].map(x => x + x).join('') : c;
bgColor: `${expandHex(color)}40`,
```

---

## Bug 2 — MAJOR: Goals and Contexts have dashed borders (GSN convention violation)

**Symptom**: Rectangle Goals (blue, green), stadium Contexts (orange), and circle Solutions all render with `border-style: dashed`. GSN standard requires Goals and Contexts to use solid borders; only Strategies use dashed to signal an open argument.

**Root cause** (`ContainerNode.svelte:10`):
```ts
const line = $derived((data.line as 'solid' | 'dashed' | undefined) ?? 'dashed');
```
Default is `'dashed'`. `App.svelte` sets `data.style: 'border: 1px solid ${color}'`, but Svelte's `style:border-style={line}` is a separate attribute that overrides the shorthand. No node in `data.json` sets a `line` property, so every non-SVG node gets dashed.

**Fix** — change the ContainerNode default to `'solid'`:
```ts
// ContainerNode.svelte:10
const line = $derived((data.line as 'solid' | 'dashed' | undefined) ?? 'solid');
```
Strategy (parallelogram) nodes already signal "open argument" visually via the SVG `stroke-dasharray="4 3"`, so they don't need the `line` CSS path.

---

## Bug 3 — MAJOR: Circle/small node labels overflow node bounds

**Symptom**: Circle nodes (90×90 px) contain full paragraph-length labels. DOM measurement shows `N04-instance` (`scrollHeight = 171px`, `clientHeight = 90px`) overflows by **81px**. The `span.label` has no `overflow: hidden` and `position: absolute` means overflow is not clipped.

**Affected nodes** (circle shape, long prose): `N04-instance`, `N31`, `V03`, `N20`, `N14`, `N15`, `N16` and the stadium `N04-thesis`.

**Fix options** (pick one or combine):

1. Clip at the container: add `overflow: hidden` to `.container-node` in `ContainerNode.svelte:89`. Then shorten `data.json` labels for circles to ≤ 2–3 words (push prose to the candidacy text or a tooltip).

2. Make circle labels much shorter in `data.json`. For example, `N04-instance` label → `"GAT+VGAE + PINN chain"` (4 words); `N31` → `"Decoupled approval"`.

---

## Bug 4 — MAJOR: Diagram renders at 0.30× zoom — text is ~2.5px (unreadable)

**Symptom**: Node extent is **2339 × 1740 px**; canvas is `width="100%"` (760 px in the MyST page) × `height="900px"`. `fitView=true` scales to `0.298×`. At 8px label font × 0.298 = **2.4 px rendered text**. The diagram is unreadable without manual zoom-in.

**Sources of the large extent**:
- K1–K9 (9 Contexts) fan horizontally off `C-thesis` → pushes `maxX` to 2339 px
- The argument chain is 9 ranks deep (C-thesis → S-thesis → N02-thesis → … → V03) at `rankSpacing: 70` → 630 px height, plus the context row adds another 1100 px
- ELK layered layout places all 9 InContextOf edges as a bottom row below the argument tree

**Fix options** (most impactful first):

1. **Shorten labels**: Replace paragraph prose in `data.json` with 3–5 word node titles for all nodes. Moves all prose to the candidacy document. This cuts the needed width by ~50%.

2. **Increase canvas height**: Change `App.svelte:86` from `height="900px"` to `height="1600px"` so the diagram fills more screen area. Users can scroll.

3. **Reduce spacing**: Lower `rankSpacing: 70 → 50` and `nodeSpacing: 40 → 25` in `App.svelte:54`.

4. **Increase font size**: Change `labelStyle` from `font-size: 8px` to `font-size: 11px` and the CSS baseline in `ContainerNode.svelte:111` from `7px` to `10px`. This does not fix zoom but improves readability once the user zooms in.

---

## Bug 5 — MODERATE: Edges are bezier curves, not straight hierarchical lines

**Symptom**: All 38 edges in `data.json` use `"type": "default"`, which maps to the built-in SvelteFlow bezier edge, producing S-curves. GSN diagrams conventionally use straight or rectilinear lines for SupportedBy and InContextOf edges. The registered custom types (`flow`, `structural`, `encoded`) are unused in this figure.

**DOM evidence**: edge `e0` path:
```
M516.7,1395 C609.4,1395 203.9,1540 296.7,1540
```
This S-curve for S-thesis → C-thesis is visually confusing in a safety-argument tree.

**Fix**: Set `"type": "flow"` on all edges in `data.json`, or add a `defaultEdgeOptions` override in `DiagramCanvas.svelte` for straight lines:

```svelte
<SvelteFlow ... defaultEdgeOptions={{ type: 'straight', markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 } }}>
```

---

## Bug 6 — MINOR: Undeveloped diamond extends 8px outside node boundary (4 nodes)

**Symptom**: `.undeveloped-mark` uses `bottom: -8px` (`ContainerNode.svelte:125`) and places a 12×12px diamond straddling the node's bottom edge. At 0.30× zoom the 2.4px overhang is invisible, but at 1× zoom it clips into edges or the node below when rank spacing is tight.

**Affected nodes**: `S-thesis`, `S-N02-instance`, `N03`, `N50`.

**Fix** (low priority): change `bottom: -8px` to `bottom: -6px`, or add `overflow: visible` to the parent so the decorator reads cleanly without shifting layout.

---

## Bug 7 — MAJOR: Edge routing crosses nodes and exits canvas

**Symptom**: Two distinct routing failures observed via Playwright path inspection.

**Failure A — edge routes off the left canvas edge** (edge `e28`, `S-N19-instance → K1 InContextOf`):
```
M266.67,815 C364.83,815 -78.16,955 20,955
```
The first bezier control point has `x = -78.16` — **18px outside the left canvas boundary**. The curve loops off-screen before landing on K1. Visible at zoom ≥ 0.5× as a hook that disappears into the left margin.

**Failure B — InContextOf fan from C-thesis creates full-width crossing spaghetti** (edges `e29–e37`):
All 9 InContextOf edges share the same source point (`x=516, y=1540`, C-thesis bottom) but reach targets at `x = 218, 458, 698, 938, 1178, 1418, 1658, 1898, 2138`. The default bezier edge does no obstacle avoidance. Every right-going edge (e29, e30, e34) sweeps across the full width of the diagram — up to 1621px of horizontal span — slicing through every Context node in the row and all the argument tree nodes above it. Sample:
```
e29:  M516,1540 C1207,1540 1207,1705 1898,1705   (1382px span, crosses 7 other nodes)
e30:  M516,1540 C1327,1540 1327,1705 2138,1705   (1622px span, crosses all)
```

**Root cause**: `"type": "default"` (SvelteFlow bezier) has no obstacle avoidance. ELK orthogonal routing is only applied to other diagram types (architecture, etc.) via `FlowEdge` — the GSN diagram bypasses it entirely. The C-thesis → K-node InContextOf topology (one hub, 9 radial spokes to a horizontal row) is pathological for a top-down layered layout because ELK places all targets in a single rank row far from the source.

**Fix**: Two-part.
1. Change all edge `"type"` from `"default"` to `"smoothstep"` (SvelteFlow built-in — routes around nodes on a grid) or wire the existing `FlowEdge` with ELK bend-point routing.
2. Restructure the InContextOf layout: either group K-nodes as a side panel (ELK `SEPARATE_CONNECTED_COMPONENTS`) or use `"type": "straight"` with `markerEnd: arrow` (lighter visual weight, conventional for InContextOf in GSN). The key is that C-thesis → K-nodes should not compete with the main argument tree for vertical rank space.

---

## Missing Feature 8 — No legend or shape key

**Symptom**: There is no visual key explaining the five GSN node shapes or the three layer colors. A reader unfamiliar with GSN has no in-figure reference for:

| Shape | GSN type | Color |
|-------|----------|-------|
| Rectangle | Goal | Blue (thesis) / Green (instance) |
| Parallelogram | Strategy | Grey (unlayered) |
| Circle | Solution | Blue or Green |
| Stadium | Context | Orange (constraint) |
| Oval | — | (unused in this diagram) |

The layer color scheme (thesis=blue, instance=green, constraint=orange) is also undocumented in the figure.

**Fix**: Add a `<Panel>` from `@xyflow/svelte` (already exported, not imported anywhere in `DiagramCanvas`) positioned at bottom-left with a compact shape+color legend. Or add a figure caption to the MyST page that explains the notation.

```svelte
<!-- DiagramCanvas.svelte — add inside <SvelteFlow> -->
import { Panel } from '@xyflow/svelte';
<Panel position="bottom-left">
  <div class="legend">…</div>
</Panel>
```

---

## Missing Feature 9 — No click interaction; all prose unrolled in nodes

**Symptom**: Every node label contains full paragraph text (up to 400 chars) rendered at 8px inside a 220×80px box. There is no way to read the detail text at the fitView zoom (0.30×), and no click interaction to reveal it. `elementsSelectable={false}` in `DiagramCanvas.svelte:63` explicitly disables all selection.

**What should happen**: Node labels should be short (ID + 2–4 word title). Clicking a node should reveal full properties — label, GSN type, layer, citations, `undeveloped` status — in a popover anchored to the node.

**SvelteFlow provides `<NodeToolbar>` natively** (verified: `@xyflow/svelte` exports it from `./plugins/NodeToolbar`). It renders a positioned panel adjacent to a selected node and handles zoom-aware placement automatically.

**What needs to change**:
1. `DiagramCanvas.svelte:63` — change `elementsSelectable={false}` to `elementsSelectable={true}`.
2. `App.svelte` — shorten `data.label` for every node to ≤ 5 words; move full prose to `data.detail`.
3. Add a `<NodeToolbar>` slot inside `ContainerNode.svelte` that renders `data.detail`, citations, and gap status when the node is selected.

This is the most impactful UX change. It also eliminates Bug 3 (label overflow) and reduces Bug 4 (layout size) as a side effect.

---

## Missing Feature 10 — No minimap; no zoom controls

**Symptom**: At 0.30× fitView zoom, the diagram is a 760×519px thumbnail of a 2339×1740px canvas. There is no minimap to show the user where they are when panned, and no zoom-in/zoom-out buttons. `panOnDrag=true` and `zoomOnScroll=true` are wired, but without visual feedback those affordances are invisible to a reader.

**SvelteFlow ships both natively** — confirmed in `node_modules/@xyflow/svelte/dist/lib/`:
- `plugins/Minimap/Minimap.svelte` — exported as `MiniMap` from `@xyflow/svelte`
- `plugins/Controls/Controls.svelte` — exported as `Controls` from `@xyflow/svelte`

Neither appears in `DiagramCanvas.svelte` or anywhere in the codebase (`grep -r "MiniMap\|Controls" interactive/src/` returns nothing).

**Fix**: Add both inside `<SvelteFlow>` in `DiagramCanvas.svelte`:

```svelte
import { MiniMap, Controls } from '@xyflow/svelte';

<SvelteFlow ...>
  <MiniMap position="bottom-right" nodeColor={n => n.data.borderColor ?? '#ccc'} />
  <Controls position="top-right" showInteractive={false} />
</SvelteFlow>
```

`MiniMap` accepts a `nodeColor` callback so it can reflect the layer color scheme. `Controls` adds +/−/fit buttons — the most common affordance readers expect on an interactive diagram.

---

## Architectural Question: Hand-rolling vs native SvelteFlow components

The diagram is built on SvelteFlow but uses it unevenly — native infrastructure for layout and edge plumbing, custom code for everything presentational, and none of the plugin layer.

**What's legitimate custom work** (SvelteFlow doesn't provide it):
- `ContainerNode.svelte` — CSS/SVG shapes (parallelogram, stadium, circle via border-radius) are not in SvelteFlow's built-in node types. Custom node registration is the correct pattern.
- `FlowEdge`, `StructuralEdge`, `EncodedEdge` — ELK bend-point rendering is not in SvelteFlow's built-in edge types. These are well-designed.

**What's being hand-rolled unnecessarily** (native equivalents exist and are better):
- **Detail display**: Full prose in node data instead of `<NodeToolbar>` popover on selection. NodeToolbar is zoom-aware and handles positioning automatically; the current approach requires fitting all text into the node box.
- **Navigation**: No `<MiniMap>` or `<Controls>`, despite both being one-import additions. The current workaround is `fitView=true` with no visual affordance for where the user is.
- **Legend/overlay**: No `<Panel>` usage. SvelteFlow Panel handles viewport-anchored overlays (legend, key, loading state) without fighting the zoom transform.

**The deeper issue — `elementsSelectable={false}`**: This flag was likely set to prevent accidental selection highlighting on a static display diagram. But it's a blunt instrument that blocks the entire `<NodeToolbar>` interaction pattern. The right fix is to keep `elementsSelectable={true}`, suppress the default selection outline via CSS (`.svelte-flow__node.selected { box-shadow: none; }`), and let NodeToolbar fire on `onclick` instead.

**The GSN diagram specifically** uses none of the three custom edge types (`flow`, `structural`, `encoded`) that the library defines for other diagrams. All 38 edges use `"type": "default"`. This means the GSN diagram doesn't get ELK orthogonal routing at all — the problem in Bug 7 is a direct consequence.

---

## Open Content Gaps (from `data.json` meta)

These are argument gaps, not rendering bugs. Both are marked `undeveloped: true` and listed in `data.json#/meta/gaps`:

| ID | Node | Severity | Remedy |
|----|------|----------|--------|
| G1 | `N03` | critical | Derive simultaneous fire+suppress on CAN data under independent fitting |
| G3 | `N50` | major | Bound Mondrian abstain rate empirically under K7, switch to pooled-class conformal, or explicitly accept in candidacy text |

---

## Summary Table

| # | Severity | Location | Symptom | Fix |
|---|----------|----------|---------|-----|
| 1 | Critical | `App.svelte:76` | Strategy nodes black (`#88840` = 5-char invalid hex) | Change fallback to `'#888888'` (6-char) |
| 2 | Major | `ContainerNode.svelte:10` | Goals/Contexts dashed (GSN violation) | Change default from `'dashed'` to `'solid'` |
| 3 | Major | `data.json` labels + `ContainerNode.svelte` | Circle labels overflow 90px node (171px scrollHeight) | Shorten labels; add `overflow: hidden` |
| 4 | Major | `App.svelte:54,86` | 0.30× zoom renders text at 2.5px | Taller canvas, less spacing, or shorter labels |
| 5 | Major | `data.json` all edges | `e28` routes off canvas (x=−78); C-thesis InContextOf fan creates full-width crossing spaghetti | Use `smoothstep` or `FlowEdge`; restructure K-node layout |
| 6 | Moderate | `data.json` all edges | Default bezier S-curves instead of straight hierarchical lines | Set edge `type: "smoothstep"` or `"straight"` |
| 7 | Moderate | `DiagramCanvas.svelte` | No minimap or zoom controls — no navigation affordance on 2339×1740 canvas | Add `<MiniMap>` + `<Controls>` (one import each) |
| 8 | Moderate | `DiagramCanvas.svelte` + `App.svelte` | No legend explaining GSN shapes or layer colors | Add `<Panel>` with shape/color key |
| 9 | Major UX | `DiagramCanvas.svelte:63` + `data.json` | All prose unrolled in 8px node text; `elementsSelectable={false}` blocks interaction | Enable selection; use `<NodeToolbar>` for click-to-expand detail |
| 10 | Minor | `ContainerNode.svelte:125` | Undeveloped diamond 8px outside node bottom edge | Reduce offset to 6px |

**Priority order**:
1. Fix #1 (one line — unblocks Strategy readability)
2. Fix #2 (one line — restores GSN border semantics)
3. Fix #9 (architectural — short labels + NodeToolbar popover; eliminates Bugs 3 and 4 as side effects)
4. Fix #5 (edge routing — prevents canvas-exit and crossing spaghetti)
5. Fix #7 + #8 (one import each — MiniMap and Controls; add Panel legend)
