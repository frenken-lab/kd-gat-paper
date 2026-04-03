---
title: "Broader Impact"
---

## Broader Impact

### Alignment with ISO/PAS 8800 Safety Standards

This research works to address the safety assurance requirements of the emerging ISO/PAS 8800:2024 (Road Vehicles -- Safety and Artificial Intelligence) standard. Specifically, the multi-expert ensemble aligns with the standard's mandate for safety monitoring and robustness against distributional shifts by employing the VGAE expert to detect out-of-distribution (OOD) inputs and the PINN expert to flag physically impossible state transitions. This will act as the "runtime monitor" recommended by ISO/PAS 8800. Furthermore, the standard emphasizes explainability and transparency as prerequisites for trust; the framework satisfies this through the integration of SHAP, LIME, and counterfactual analysis, providing the human-interpretable evidence required for safety audits. Finally, the DQN-based fusion agent functions as a risk governance mechanism, dynamically mitigating the risk of single-model failure by adaptively weighting experts based on confidence, ensuring that the AI system remains reliable even in unforeseen scenarios.
