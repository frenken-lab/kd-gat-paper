---
title: "Background (Candidacy-Unique)"
---

## Cross-Window Detector (CWD)

At time $t$, the pipeline first *collects* the most recent $K$ window descriptors and *stacks* them into a context sequence

```{math}
:label: eq-cwd-context
X_t=\big[\phi(w_{t-K+1}),\ldots,\phi(w_t)\big]\in\mathbb{R}^{K\times 15},
```

so outputs exist only for $t\!\ge\!K$ (only SWGD functions at this time). This raw sequence then *enters* a fixed Min-Max normalizer whose parameters $(m_{\min},m_{\max})$ are fitted once on the CWD training split and frozen.
Each 15-D step of $\tilde{X}_t$ is *projected* by a shared linear layer to a $d_T$-dimensional token, *augmented* with sinusoidal positions, and then *processed* by a lightweight Transformer encoder, producing a sequence of contextualized tokens. The next stage *pools* these $K$ tokens (mean by default) into a single window embedding $h_t\in\mathbb{R}^{d_T}$, which is *fed* to a one-layer feed-forward head to *produce* the window logit and probability

```{math}
:label: eq-cwd-output
s_T(w_t)=\ell_T(h_t),\quad p_T=\sigma\!\big(s_T(w_t)\big).
```
