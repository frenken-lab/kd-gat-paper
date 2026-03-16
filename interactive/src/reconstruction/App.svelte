<script>
  // TODO: VGAE composite reconstruction error distribution
  // Data contract: { composite_error, node_error, neighbor_error, canid_error, label, attack_type }
  // Source: KD-GAT experimentruns/*/eval_*/embeddings.npz → vgae_errors + metrics.json
  import data from "./data.json";
</script>

<div style="font-family: system-ui, sans-serif; padding: 16px;">
  <h3 style="font-size: 14px; color: #333;">VGAE Reconstruction Error Distribution</h3>
  <p style="color: #999; font-size: 12px;">
    Awaiting data export from KD-GAT ({data.length} samples loaded)
  </p>
</div>
