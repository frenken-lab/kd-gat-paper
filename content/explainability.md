---
title: "Explainability"
---

## Explainability

### UMAP Analysis

To understand the representations learned by our model, we perform UMAP-based feature analysis using both raw input statistics and learned graph embeddings. We sample 10% of graphs from the HCRL Car-Hacking dataset.

Raw CAN-graph data projected via UMAP shows loose clustering that indicates limited separability between normal and attack types. In contrast, UMAP projections of graph-level embeddings from the trained GAT classifier's penultimate layer reveal well-separated clusters.

Despite binary supervision (attack vs. normal), the learned embedding space forms well-separated clusters aligned with specific attack types (DoS, Fuzzy, Gear, RPM). This emergent multi-class structure demonstrates that our model captures high-level semantic patterns in CAN traffic and generalizes across attack categories without explicit multi-class labels. The clear cluster separation in embedding space, absent in raw features, validates the GAT's ability to learn discriminative representations from graph-structured temporal data.

:::{iframe} https://robertfrenken.github.io/kd-gat-paper/assets/html/submission/umap.html
:label: fig-umap
:width: 100%
UMAP projections of GAT embeddings (10% sample). Toggle attack types to explore cluster separation.
:::

### Composite VGAE Reconstruction Error

To assess the overall reconstruction quality of the VGAE, we combine three types of reconstruction errors: node feature reconstruction error ($E_{\text{node}}$), neighborhood reconstruction error ($E_{\text{neighbor}}$), and CAN ID prediction error ($E_{\text{CAN\,ID}}$). Each error captures a different aspect of the graph structure and message semantics. We compute a single composite score as a weighted sum:

```{math}
:label: eq-composite-error
\mathrm{Composite\_Error} = \alpha\, E_{\text{node}} + \beta\, E_{\text{neighbor}} + \gamma\, E_{\text{CAN\,ID}}
```

where $\alpha$, $\beta$, and $\gamma$ are empirically chosen weights that regulate each term's influence. In our experiments, we use $\alpha = 1.0$, $\beta = 20.0$, and $\gamma = 0.3$.

This approach enables the detection of subtle anomalies by jointly evaluating node content, CAN identifier semantics, and local neighborhood structure.

:::{iframe} https://robertfrenken.github.io/kd-gat-paper/assets/html/submission/reconstruction.html
:label: fig-reconstruction
:width: 100%
VGAE reconstruction error decomposition. Top: per-component distributions (normal vs attack). Middle: error heatmap sorted by composite score. Bottom: per-component ROC curves.
:::

### DQN-Fusion Analysis

The learned DQN fusion policy exhibits interpretable, context-specific weighting that validates adaptive expert selection. Analysis reveals a strong correlation between VGAE anomaly scores and fusion weights: low VGAE scores cluster at $\alpha \approx 0$ (favoring the robust expert), while higher scores transition to intermediate weights, demonstrating the policy learned to default to VGAE's out-of-distribution detection while conditionally leveraging GAT's strength on known attacks. The multimodal distribution with peaks at $\alpha \approx 0, 0.2, 0.4, 0.6, 0.8$ indicates the DQN discovered distinct attack-type-specific strategies rather than learning fixed averaging ($\alpha = 0.5$). Critically, the divergence between normal and attack distributions validates meaningful anomaly detection logic.

:::{iframe} https://robertfrenken.github.io/kd-gat-paper/assets/html/submission/fusion.html
:label: fig-fusion
:width: 100%
DQN fusion weight distribution by attack type. Peaks at distinct $\alpha$ values indicate learned attack-type-specific strategies.
:::

### GAT Attention Weights

To understand which CAN message relationships the GAT deems important, we visualize the learned attention weights on selected graphs. Edge width and opacity are proportional to the mean attention across heads for a given layer.

:::{iframe} https://robertfrenken.github.io/kd-gat-paper/assets/html/submission/attention.html
:label: fig-attention
:width: 100%
GAT attention weights on selected CAN bus graphs. Select different graphs and layers to compare normal vs attack attention patterns.
:::
