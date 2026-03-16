<script>
  // TODO: CKA similarity heatmap (teacher vs student layers)
  // Data contract: { matrix: number[][], teacher_layers: string[], student_layers: string[] }
  // Source: KD-GAT experimentruns/*/eval_*/cka_matrix.json
  import data from "./data.json";
</script>

<div style="font-family: system-ui, sans-serif; padding: 16px;">
  <h3 style="font-size: 14px; color: #333;">CKA Teacher–Student Layer Similarity</h3>
  <p style="color: #999; font-size: 12px;">
    Awaiting data export from KD-GAT ({data.length || 0} entries loaded)
  </p>
</div>
