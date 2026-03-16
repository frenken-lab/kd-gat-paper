<script>
  // TODO: GAT attention weight visualization (node-link graph)
  // Data contract: array of { graph_idx, label, nodes: [{id, can_id}], edges: [{source, target, attention}], layers: number }
  // Source: KD-GAT experimentruns/*/eval_*/attention_weights.npz (sampled, ≤50 graphs)
  import data from "./data.json";
</script>

<div style="font-family: system-ui, sans-serif; padding: 16px;">
  <h3 style="font-size: 14px; color: #333;">GAT Attention Weights</h3>
  <p style="color: #999; font-size: 12px;">
    Awaiting data export from KD-GAT ({data.length} samples loaded)
  </p>
</div>
