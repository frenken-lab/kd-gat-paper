---
title: "Ablation Study"
---

## Ablation Study

To assess the contribution of different model configurations, we perform ablation experiments investigating three key variables: Knowledge Distillation, supervised learning training strategies (curriculum learning and hard sample mining), and fusion effectiveness, comparing standalone and fused architectures. [](#tbl-ablation-kd), [](#tbl-ablation-gat), and [](#tbl-ablation-fusion) test different configurations across two of the six datasets.

### Knowledge Distillation Effects

```{code-cell} python
:tags: [remove-input]
:label: tbl-ablation-kd
:caption: "Ablation Study: Knowledge Distillation Effects"

import pandas as pd
from IPython.display import Markdown

df = pd.read_csv("data/ablation_kd.csv")
Markdown(df.to_markdown(index=False))
```

To further characterize how knowledge transfers between teacher and student networks, we compute Centered Kernel Alignment (CKA) between all pairs of teacher and student layers. High CKA values indicate that corresponding layers learn similar representations despite the 20$\times$ parameter reduction.

:::{iframe} ../figures/cka.html
:label: fig-cka
:width: 100%
CKA similarity between teacher and student GAT layers. Hover for exact values.
:::

### GAT Training Strategy

```{code-cell} python
:tags: [remove-input]
:label: tbl-ablation-gat
:caption: "Ablation Study: GAT Training Strategy Comparison"

import pandas as pd
from IPython.display import Markdown

df = pd.read_csv("data/ablation_gat_training.csv")
Markdown(df.to_markdown(index=False))
```

### DQN Fusion vs. Baseline Strategies

```{code-cell} python
:tags: [remove-input]
:label: tbl-ablation-fusion
:caption: "Ablation Study: DQN Fusion vs. Baseline Strategies"

import pandas as pd
from IPython.display import Markdown

df = pd.read_csv("data/ablation_fusion.csv")
Markdown(df.to_markdown(index=False))
```
