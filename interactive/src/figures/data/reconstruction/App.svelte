<script>
  import Figure from "../../../lib/Figure.svelte";
  import {
    Plot,
    RectY,
    Line,
    Cell,
    RuleX,
    RuleY,
    binX,
    Pointer,
    AxisX,
    AxisY,
  } from "svelteplot";
  import { useToggleFilter } from "../../../lib/useToggleFilter.svelte.js";
  import { buildColorMap } from "../../../lib/usePaletteColors.js";
  import { resolve } from "../../../lib/flow/palette.js";
  import data from "./data.json";

  const isEmpty = !data?.kde;

  const {
    visible,
    toggle,
    types,
    filtered: filteredKde,
  } = useToggleFilter(
    () => (isEmpty ? [] : data.kde),
    (d) => d.component,
  );
  const filteredRoc = $derived(
    isEmpty ? [] : data.roc.filter((d) => visible[d.component]),
  );

  // Derive component list and colors from data
  const components = isEmpty
    ? []
    : [...new Set(data.kde.map((d) => d.component))];
  // Set colors for each component
  const componentColorMap = buildColorMap(components, [
    "blue",
    "orange",
    "green",
    "red",
  ]);
</script>

<Figure title="VGAE Reconstruction Error Decomposition">
  {#if isEmpty}
    <p class="empty">Awaiting data export from KD-GAT</p>
  {:else}
    <div class="controls">
      {#each types as c}
        <button
          class="toggle"
          style:--chip-color={componentColorMap[c]}
          class:active={visible[c]}
          class:inactive={!visible[c]}
          onclick={() => toggle(c)}>{c}</button
        >
      {/each}
    </div>

    <h4>Component Distributions</h4>
    <Plot height={280} x={{ label: "Error Value" }} y={{ label: "Count" }}>
      {#each components as c}
        {#if visible[c]}
          <RectY
            {...binX(
              {
                data: filteredKde.filter((d) => d.component === c),
                x: "value",
                fy: "class",
              },
              { y: "count" },
            )}
            fill={componentColorMap[c]}
            opacity={0.7}
          />
        {/if}
      {/each}
      <RuleY data={[0]} />
    </Plot>

    <h4>Error Heatmap</h4>
    <Plot
      padding={0}
      height={160}
      marginLeft={12}
      x={{ type: "band", label: "Component" }}
      y={{ type: "band", axis: false }}
      color={{
        type: "linear",
        scheme: [resolve("yellow").stroke, resolve("red").stroke],
        label: "Error",
        legend: true,
      }}
    >
      <Cell
        data={data.heatmap}
        x="component"
        y="row"
        fill="value"
        inset={0.5}
      />
    </Plot>

    <h4>Per-Component ROC</h4>
    <Plot
      height={300}
      marginLeft={30}
      x={{ label: "FPR", domain: [0, 1] }}
      y={{ label: "TPR", domain: [0, 1] }}
    >
      <AxisX />
      <AxisY />
      {#each components as c}
        {#if visible[c]}
          <Line
            data={filteredRoc.filter((d) => d.component === c)}
            x="fpr"
            y="tpr"
            stroke={componentColorMap[c]}
            strokeWidth={2}
          />
        {/if}
      {/each}
      <Pointer data={filteredRoc} x="fpr" y="tpr" maxDistance={30}>
        {#snippet children({ data })}
          <RuleX {data} x="fpr" opacity="0.3" />
          <RuleY {data} y="tpr" opacity="0.3" />
          <AxisX data={data.map((d) => d.fpr)} tickFormat={(d) => d} />
          <AxisY data={data.map((d) => d.tpr)} tickFormat={(d) => d} />
        {/snippet}
      </Pointer>
    </Plot>
  {/if}
</Figure>
