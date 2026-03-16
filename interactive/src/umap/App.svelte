<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";

  // Data contract: expects JSON array of { x, y, label, attack_type, confidence, graph_idx }
  // Exported from KD-GAT: scripts/export_paper_data.py → figures/umap/data.json
  import data from "./data.json";

  let svgEl;
  let width = 720;
  let height = 500;
  let margin = { top: 20, right: 140, bottom: 40, left: 50 };

  // Attack type toggles
  let attackTypes = [...new Set(data.map((d) => d.attack_type))];
  let visible = Object.fromEntries(attackTypes.map((t) => [t, true]));

  // Color scale matching KD-GAT conventions
  const color = d3
    .scaleOrdinal()
    .domain(attackTypes)
    .range(d3.schemeTableau10);

  let tooltip = { show: false, x: 0, y: 0, content: "" };

  $: filteredData = data.filter((d) => visible[d.attack_type]);

  onMount(() => draw());

  $: if (svgEl && filteredData) draw();

  function draw() {
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const x = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.x))
      .nice()
      .range([0, innerW]);

    const y = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.y))
      .nice()
      .range([innerH, 0]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(6))
      .append("text")
      .attr("x", innerW / 2)
      .attr("y", 35)
      .attr("fill", "#333")
      .attr("text-anchor", "middle")
      .text("UMAP 1");

    g.append("g")
      .call(d3.axisLeft(y).ticks(6))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -40)
      .attr("fill", "#333")
      .attr("text-anchor", "middle")
      .text("UMAP 2");

    // Points
    g.selectAll("circle")
      .data(filteredData)
      .join("circle")
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => y(d.y))
      .attr("r", 2.5)
      .attr("fill", (d) => color(d.attack_type))
      .attr("opacity", 0.6)
      .on("mouseenter", (event, d) => {
        tooltip = {
          show: true,
          x: event.pageX + 10,
          y: event.pageY - 10,
          content: `${d.attack_type} | idx: ${d.graph_idx} | conf: ${d.confidence.toFixed(3)}`,
        };
      })
      .on("mouseleave", () => {
        tooltip = { ...tooltip, show: false };
      });
  }

  function toggleType(type) {
    visible[type] = !visible[type];
    visible = { ...visible }; // trigger reactivity
  }
</script>

<div style="font-family: system-ui, sans-serif; max-width: {width + 20}px;">
  <h3 style="margin: 0 0 8px; font-size: 14px; color: #333;">
    UMAP Projections of GAT Embeddings
  </h3>

  <!-- Legend toggles -->
  <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 8px;">
    {#each attackTypes as type}
      <button
        onclick={() => toggleType(type)}
        style="
          display: flex; align-items: center; gap: 4px;
          padding: 2px 8px; border: 1px solid #ccc; border-radius: 4px;
          background: {visible[type] ? color(type) + '22' : '#f5f5f5'};
          cursor: pointer; font-size: 12px;
          opacity: {visible[type] ? 1 : 0.4};
        "
      >
        <span
          style="width: 10px; height: 10px; border-radius: 50%; background: {color(type)};"
        ></span>
        {type}
      </button>
    {/each}
  </div>

  <svg bind:this={svgEl} {width} {height}></svg>

  <!-- Tooltip -->
  {#if tooltip.show}
    <div
      style="
        position: fixed; left: {tooltip.x}px; top: {tooltip.y}px;
        background: white; border: 1px solid #ccc; border-radius: 4px;
        padding: 4px 8px; font-size: 11px; pointer-events: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.15); z-index: 100;
      "
    >
      {tooltip.content}
    </div>
  {/if}
</div>
