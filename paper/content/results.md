---
title: "Results and Discussion"
---

## Results and Discussion

### Test Set Performance

[](#tbl-main-results) and [](#tbl-test-scenarios) summarize the test set performance across six datasets. We compare against four GNN-based baselines: KD-GAT [@frenken2025kdgat], A&D GAT [@AD], G-IDCS [@Park], and GUARD-CAN [@guardcan2025]. KD-GAT serves as the primary baseline since it is the only method evaluated on the comprehensive can-train-and-test dataset [@Lampe2024cantrainandtest].

Our approach demonstrates consistent improvements across all datasets, with particularly significant gains on highly imbalanced datasets. Compared to KD-GAT, we achieve an average improvement of 2.09% in accuracy and 16.22% in F1-score. The most substantial improvements occur on challenging datasets S02 and S04, where F1-scores improve by 55.25% and 30.64% respectively, indicating superior handling of severe class imbalance.

:::{table} Test Performance on HCRL Car-Hacking Dataset
:label: tbl-main-results

```{include} ../../_build/tables/main_results.md
```
:::

:::{iframe} https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/results-table.html
:label: fig-results-table
:width: 100%
Interactive results table. Click column headers to sort; use the filter to search models.
:::

:::{table} Cross-Scenario Test Results
:label: tbl-test-scenarios

```{include} ../../_build/tables/test_scenarios.md
```
:::

### Discussion

**Class Imbalance Handling:** Our multi-stage approach demonstrates superior performance on imbalanced datasets compared to single-stage methods. The VGAE component effectively captures structural anomalies even with limited attack samples, while the GAT classifier benefits from the refined feature representations. This combination proves particularly effective on datasets S02 and S04, where traditional methods struggle with extreme class ratios.

**Generalization Capability:** The consistent performance across diverse datasets (CarH, CarS, and can-train-and-test subsets) demonstrates strong generalization. Unlike previous methods that show significant performance degradation on unseen test data, our approach maintains robust detection capabilities across different attack types and network conditions.
