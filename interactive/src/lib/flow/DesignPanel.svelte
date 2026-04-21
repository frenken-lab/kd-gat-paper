<script lang="ts">
  import { Panel, useSvelteFlow } from '@xyflow/svelte';
  import { saveLayout } from './serialize.ts';
  import { autoLayout } from './layout.ts';
  import type { DiagramNode, DiagramEdge } from './types.ts';

  let {
    nodes = $bindable([]),
    edges = $bindable([]),
    direction = 'LR',
  }: {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    direction?: 'LR' | 'TB';
  } = $props();

  const { toObject, fitView } = useSvelteFlow();

  function handleSave() {
    const obj = toObject();
    const layout = saveLayout(obj);
    const json = JSON.stringify(layout, null, 2);

    // Copy to clipboard and log for manual save
    navigator.clipboard?.writeText(json).then(
      () => console.log('[DesignPanel] Layout copied to clipboard'),
      () => console.log('[DesignPanel] Clipboard write failed'),
    );
    console.log('[DesignPanel] Layout JSON:\n', json);
    alert('Layout JSON copied to clipboard. Paste into layout.json in the figure directory.');
  }

  function handleAutoLayout() {
    const layoutNodes = nodes.filter((n) => n.type !== 'container');
    const laidOut = autoLayout(layoutNodes, edges, { direction });
    const posMap = new Map(laidOut.map((n) => [n.id, n.position]));
    nodes = nodes.map((n) => {
      const pos = posMap.get(n.id);
      return pos ? { ...n, position: pos } : n;
    });
    setTimeout(() => fitView({ duration: 300 }), 50);
  }

  function handleFitView() {
    fitView({ duration: 300 });
  }
</script>

<Panel position="top-right">
  <div class="design-panel">
    <span class="title">Design</span>
    <button onclick={handleAutoLayout} title="Re-run dagre auto-layout">Layout</button>
    <button onclick={handleFitView} title="Fit diagram to viewport">Fit</button>
    <button onclick={handleSave} title="Copy layout.json to clipboard">Save</button>
  </div>
</Panel>

<style>
  .design-panel {
    display: flex;
    gap: 4px;
    align-items: center;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 4px 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 11px;
  }

  .title {
    font-weight: 600;
    color: #666;
    margin-right: 4px;
  }

  button {
    font-size: 11px;
    padding: 2px 8px;
    cursor: pointer;
    background: #f5f5f5;
    border: 1px solid #ccc;
    border-radius: 3px;
    font-family: inherit;
  }

  button:hover {
    background: #eee;
  }
</style>
