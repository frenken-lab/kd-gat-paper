# fedavg-drift — Figure Spec

## What this figure represents

A geometric schematic of FedAvg client drift under fleet non-IID data. After $E$ local SGD steps, each client's iterate has moved toward its own local minimum; FedAvg of those endpoints is a biased step in global parameter space — pointed away from the true gradient direction.

**Coordinate system:** 2D parameter space θ₁ × θ₂. Client local minima are schematic — placed in distinct quadrants so drift directions are visually incompatible, not derived from a live dataset.

## Elements

| Element                           | Visual         | What it represents                                                                             |
| --------------------------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| Loss landscape                    | Teal contours  | Paraboloid $L(\theta) = (\theta_1 - \theta_1^*)^2 + (\theta_2 - \theta_2^*)^2$ centered at θ\* |
| θ^(t)                             | Open circle    | Current global iterate; start of all arrows                                                    |
| θ\*                               | Filled circle  | Global minimum of the population loss                                                          |
| Client arrows (blue/orange/green) | Colored arrows | Each client's iterate after $E$ local steps toward its local min                               |
| × markers                         | Colored ×      | Each client's local minimum θᵢ\*                                                               |
| FedAvg arrow                      | Thick grey     | Unweighted mean of client endpoints — the biased aggregate                                     |
| True gradient                     | Thin dark      | −∇F(θ^(t)): reference direction toward θ\*                                                     |

**E slider:** Controls local steps $E \in [1, 15]$. Client endpoints are computed via the closed-form quadratic iterate:
$$\theta_i(E) = \theta_i^* + (\theta^{(t)} - \theta_i^*)(1 - \alpha)^E, \quad \alpha = 0.25$$
As $E$ increases, clients drift further toward their local minima and the FedAvg aggregate deviates further from the true gradient.

## Client local minima

| Client | Drift type    | θ₁\* | θ₂\* |
| ------ | ------------- | ---- | ---- |
| 1      | Label shift   | −3.2 | 3.0  |
| 2      | Feature shift | 3.5  | 2.2  |
| 3      | Concept shift | 3.2  | −3.5 |

## Simplifications

- Quadratic local losses (exact iterate formula); real losses are non-convex.
- Three clients, one non-IID axis each; real clients mix axes.
- Unweighted FedAvg mean (equal client dataset sizes assumed).
- Client minima are schematic, not computed from any dataset.

## Open question

The original spec included a SCAFFOLD correction arrow (thick purple, pointing toward θ\*) as part of the claimed "single claim illustrated." It is not currently in the figure. The title scopes only to FedAvg drift, which is self-contained. Add the correction arrow if this figure is used to motivate a SCAFFOLD-based FL contribution in the paper/candidacy.
