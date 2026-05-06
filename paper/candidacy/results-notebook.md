---
title: Ablation Results
short_title: Results
kernelspec:
  name: python3
  display_name: Python 3
jupyter: false
---

F1 macro mean per variant across the KD-GAT ablation groups, pulled live from the HuggingFace dataset at build time.

```{code-cell} python
:tags: [remove-input]
from huggingface_hub import hf_hub_download
import polars as pl
import altair as alt

df = (
    pl.read_parquet(
        hf_hub_download(
            "buckeyeguy/graphids-kd-gat",
            "metrics/leaderboard.parquet",
            repo_type="dataset",
        )
    )
    .to_pandas()
)
```

```{code-cell} python
:tags: [remove-input]
alt.Chart(df).mark_bar().encode(
    x=alt.X("mean:Q", scale=alt.Scale(zero=False), title="F1 macro"),
    y=alt.Y("variant:N", sort="-x", title=None),
    color=alt.Color("group:N", legend=alt.Legend(title="ablation group")),
    tooltip=[
        "variant",
        "group",
        "dataset",
        "n_seeds",
        alt.Tooltip("mean:Q", format=".4f"),
    ],
).properties(
    width=500,
    title="KD-GAT ablation — F1 macro by variant (set_01)",
)
```
