<script lang="ts">
  import '@xyflow/svelte/dist/style.css';
  import 'virtual:theme-vars.css';

  import {
    type EdgeTypes,
    type NodeTypes,
    MarkerType,
    type DefaultEdgeOptions,
    SvelteFlow,
  } from '@xyflow/svelte';

  import { EncodedEdge, FlowEdge, StructuralEdge, CircleNode, loadSpec, specToFlow } from '../lib/flow';
  import ContainerNode from '../lib/flow/nodes/ContainerNode.svelte';
  import type { DiagramEdge, DiagramNode, BridgeSpec } from '../lib/flow';

  const { model } = $props<{ model: any }>();

  const nodeTypes: NodeTypes = { circle: CircleNode, container: ContainerNode };
  const edgeTypes: EdgeTypes = { structural: StructuralEdge, flow: FlowEdge, encoded: EncodedEdge };
  const defaultEdgeOptions: DefaultEdgeOptions = {
    markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
  };

  let nodes = $state<DiagramNode[]>([]);
  let edges = $state<DiagramEdge[]>([]);
  let specRaw = $state<Record<string, any>>({});
  let componentIds = $state<string[]>([]);
  let bridges = $state<BridgeSpec[]>([]);

  // Patch accumulator: only components the user changed
  let componentChanges = $state<Record<string, { label?: string; role?: string }>>({});

  let selectedId = $state<string | null>(null);
  let draftLabel = $state('');
  let draftRole = $state('');

  const ROLES = ['vgae', 'gat', 'kd', 'neutral'];

  async function loadFromModel() {
    const raw = JSON.parse(model.get('spec') || '{}');
    specRaw = raw;
    componentIds = Object.keys(raw.components ?? {});
    bridges = JSON.parse(JSON.stringify(raw.bridges ?? []));
    componentChanges = {};
    selectedId = null;

    try {
      const spec = loadSpec(raw);
      const result = await specToFlow(spec);
      nodes = result.nodes;
      edges = result.edges;
    } catch (e) {
      console.error('specToFlow failed:', e);
    }
  }

  $effect(() => {
    loadFromModel();
    model.on('change:spec', loadFromModel);
    return () => model.off('change:spec', loadFromModel);
  });

  function onselectionchange({ nodes: sel }: { nodes: DiagramNode[] }) {
    if (sel.length === 0) {
      selectedId = null;
      return;
    }
    const id = sel[0].id;
    // Leaf node IDs may be prefixed (e.g. "teacher__n0"). Map back to component ID.
    const compId = componentIds.find(c => id === c || id.startsWith(c + '__')) ?? null;
    if (!compId) return;
    selectedId = compId;
    const comp = specRaw.components?.[compId] ?? {};
    const pending = componentChanges[compId] ?? {};
    draftLabel = pending.label ?? comp.label ?? compId;
    draftRole = pending.role ?? comp.role ?? '';
  }

  function applyComponentEdit() {
    if (!selectedId) return;
    const orig = specRaw.components?.[selectedId] ?? {};
    const changes: { label?: string; role?: string } = {};
    if (draftLabel !== (orig.label ?? selectedId)) changes.label = draftLabel;
    if (draftRole !== (orig.role ?? '')) changes.role = draftRole;
    if (Object.keys(changes).length > 0) {
      componentChanges = { ...componentChanges, [selectedId]: { ...componentChanges[selectedId], ...changes } };
    }
    pushPatch();
  }

  function addBridge() {
    if (componentIds.length < 2) return;
    bridges = [...bridges, { from: componentIds[0], to: componentIds[1] }];
    pushPatch();
  }

  function removeBridge(i: number) {
    bridges = bridges.filter((_, idx) => idx !== i);
    pushPatch();
  }

  function updateBridge(i: number, field: 'from' | 'to', value: string) {
    bridges = bridges.map((b, idx) => (idx === i ? { ...b, [field]: value } : b));
    pushPatch();
  }

  function pushPatch() {
    const patch: Record<string, any> = {};
    if (Object.keys(componentChanges).length > 0) patch.components = componentChanges;
    patch.bridges = bridges;
    model.set('patch', JSON.stringify(patch));
    model.save_changes();
  }
</script>

<div class="spec-editor">
  <div class="canvas-wrap">
    <SvelteFlow
      bind:nodes
      bind:edges
      {nodeTypes}
      {edgeTypes}
      {defaultEdgeOptions}
      fitView
      elementsSelectable={true}
      nodesDraggable={false}
      nodesConnectable={false}
      panOnDrag={true}
      zoomOnScroll={true}
      minZoom={0.2}
      maxZoom={4}
      proOptions={{ hideAttribution: true }}
      {onselectionchange}
    />
  </div>

  <aside class="side-panel">
    {#if selectedId}
      <section>
        <h3>Component: <code>{selectedId}</code></h3>
        <label>
          Label
          <input type="text" bind:value={draftLabel} />
        </label>
        <label>
          Role
          <select bind:value={draftRole}>
            <option value="">— none —</option>
            {#each ROLES as r}
              <option value={r}>{r}</option>
            {/each}
          </select>
        </label>
        <button onclick={applyComponentEdit}>Apply</button>
      </section>
    {:else}
      <section class="hint">Click a node to edit it.</section>
    {/if}

    <section>
      <h3>Bridges <button class="add-btn" onclick={addBridge}>+ Add</button></h3>
      {#each bridges as bridge, i}
        <div class="bridge-row">
          <select value={bridge.from} onchange={e => updateBridge(i, 'from', (e.target as HTMLSelectElement).value)}>
            {#each componentIds as id}
              <option value={id}>{id}</option>
            {/each}
          </select>
          <span>→</span>
          <select value={bridge.to} onchange={e => updateBridge(i, 'to', (e.target as HTMLSelectElement).value)}>
            {#each componentIds as id}
              <option value={id}>{id}</option>
            {/each}
          </select>
          <button class="remove-btn" onclick={() => removeBridge(i)}>✕</button>
        </div>
      {/each}
      {#if bridges.length === 0}
        <p class="hint">No bridges.</p>
      {/if}
    </section>

    {#if Object.keys(componentChanges).length > 0}
      <section class="pending">
        <h3>Pending changes</h3>
        {#each Object.entries(componentChanges) as [id, ch]}
          <div class="change-row">
            <code>{id}</code>:
            {#each Object.entries(ch) as [k, v]}
              <span>{k} → <em>{v}</em></span>
            {/each}
          </div>
        {/each}
        <p class="hint">Call <code>editor.save()</code> to write to spec.yaml.</p>
      </section>
    {/if}
  </aside>
</div>

<style>
  .spec-editor {
    display: flex;
    height: 520px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    border: 1px solid #ddd;
    border-radius: 6px;
    overflow: hidden;
  }

  .canvas-wrap {
    flex: 1;
    min-width: 0;
    position: relative;
  }

  /* suppress default handle dots same as DiagramCanvas */
  .canvas-wrap :global(.svelte-flow__handle) {
    width: 0;
    height: 0;
    min-width: 0;
    min-height: 0;
    background: transparent;
    border: none;
    box-shadow: none;
  }

  .canvas-wrap :global(.svelte-flow__node-default) {
    width: 100%;
    height: 100%;
    padding: 4px 8px;
    border-radius: 6px;
    border: 1.5px solid var(--ns, #ccc);
    background: var(--nf, #fff);
    font-size: 9px;
    color: #333;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    box-sizing: border-box;
  }

  /* highlight selected nodes */
  .canvas-wrap :global(.svelte-flow__node.selected > *) {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  aside.side-panel {
    width: 240px;
    flex-shrink: 0;
    border-left: 1px solid #ddd;
    overflow-y: auto;
    padding: 8px;
    background: #fafafa;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  section {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    padding: 8px;
  }

  h3 {
    margin: 0 0 8px;
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 6px;
    font-size: 11px;
    color: #6b7280;
  }

  input, select {
    font-size: 12px;
    padding: 3px 6px;
    border: 1px solid #d1d5db;
    border-radius: 3px;
    background: #fff;
  }

  button {
    margin-top: 4px;
    padding: 3px 10px;
    font-size: 12px;
    border: 1px solid #d1d5db;
    border-radius: 3px;
    cursor: pointer;
    background: #f3f4f6;
  }

  button:hover { background: #e5e7eb; }

  .add-btn {
    margin: 0;
    padding: 1px 6px;
    font-size: 11px;
  }

  .remove-btn {
    margin: 0;
    padding: 1px 5px;
    font-size: 11px;
    color: #ef4444;
  }

  .bridge-row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;
    font-size: 11px;
  }

  .bridge-row select { flex: 1; min-width: 0; }

  .hint { color: #9ca3af; font-size: 11px; margin: 0; }

  .pending { background: #fffbeb; border-color: #fde68a; }

  .change-row {
    font-size: 11px;
    margin-bottom: 4px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
  }

  code { font-size: 11px; background: #f3f4f6; padding: 1px 3px; border-radius: 2px; }
  em { font-style: normal; font-weight: 600; color: #1d4ed8; }
</style>
