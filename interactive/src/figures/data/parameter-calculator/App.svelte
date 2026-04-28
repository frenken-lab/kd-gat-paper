<script lang="ts">
  // Skeleton for the parameter calculator. Real implementation pending —
  // see ./spec.md for the full design. The shape below is the target:
  //
  //   one $state(knobs) → one $derived(result) → three sub-components.
  //
  // Until KnobsPanel / ResultPanel / PresetPicker are written, this file
  // renders an "awaiting calibration" placeholder that satisfies build.js.

  import Figure from "../../../lib/Figure.svelte";
  import { compute, type Knobs } from "./formulas.ts";
  import data from "./data.json";

  let knobs: Knobs = $state(data.presets[0].knobs as Knobs);
  let result = $derived(compute(knobs));
</script>

<Figure title="Parameter / FLOP Estimator">
  <p class="placeholder">
    Awaiting calibration. See <code>spec.md</code> for the design and
    <code>formulas.ts</code> for the calibration TODO. Current knobs:
    <code>{knobs.model}</code>, {result.total} params (stub).
  </p>
</Figure>

<style>
  .placeholder {
    color: #666;
    font-size: 0.95em;
    padding: 1.5em;
    text-align: center;
  }
  code {
    font-family: ui-monospace, monospace;
    font-size: 0.9em;
  }
</style>
