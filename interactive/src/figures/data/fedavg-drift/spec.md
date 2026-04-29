# fedavg-drift — Figure Spec

## What this figure represents

A geometric schematic of FedAvg client drift under fleet non-IID data. After $E$ local SGD steps, each client's iterate has moved toward its own local minimum; FedAvg of those endpoints is a biased step in global parameter space.

**Coordinate system:** 2D parameter space θ₁ × θ₂. All positions are schematic — hand-placed for visual clarity, not derived from a live gradient computation.

**Elements:**
- **Loss landscape contours** (teal) — paraboloid $L(\theta) = (\theta_1 - \theta_1^*)^2 + (\theta_2 - \theta_2^*)^2$ centered at θ*. Gives spatial context so "the wrong quadrant" is readable without annotation.
- **θ^(t)** (open circle) — current global iterate; start of all arrows.
- **θ*** (filled circle) — global minimum.
- **Three client arrows** (blue / orange / green) — where each client's iterate lands after $E$ local steps, pulled toward its local minimum. One client per non-IID axis: label shift (upper-left), feature shift (upper-right), concept shift (lower-right).
- **FedAvg arrow** (thick grey) — mean of the three client endpoints. Points rightward, away from θ*.
- **SCAFFOLD arrow** (thick purple) — schematic corrected aggregate, pointing toward θ*.
- **True gradient arrow** (thin dark) — steepest descent on the global loss at θ^(t); reference direction.

**Single claim illustrated:** The sentence "FedAvg converges to a stationary point of $\sum_i \frac{n_i}{n} F_i$ rather than $F$" is abstract. The figure makes the geometry visible: client iterates radiate in incompatible directions, their average is biased, SCAFFOLD corrects it.

## Current simplifications

- Client arrow endpoints are hand-placed, not computed from actual local losses.
- Three clients, one axis each — real clients mix axes.
- SCAFFOLD endpoint is schematic; the actual guarantee is IID-like convergence rate, not exact alignment with the true gradient.
- Local minima for each client are implied by arrow direction but not shown as markers.

## Planned enhancements

### 1. E-slider (drift accumulates with local steps)

Add a slider for $E \in [1, 10]$. At each E value, recompute client endpoints using the closed-form iterate of a quadratic local loss:

$$\theta_i^{(t+E)} = \theta_i^* + (\theta^{(t)} - \theta_i^*)(1 - \alpha)^E$$

where $\alpha$ is a fixed learning rate (e.g. 0.25) and $\theta_i^*$ is each client's local minimum (see coordinates below). As $E$ increases:
- Client arrows grow toward their respective local minima
- FedAvg arrow deviates further from the true gradient direction
- The "drift accumulates" claim becomes dynamic rather than static

FedAvg arrow updates as mean of the three recomputed endpoints. SCAFFOLD arrow stays fixed (it corrects regardless of $E$ under bounded variance).

**Client local minima** (to be shown as × markers and used in slider computation):
| Client | Axis | θ₁* | θ₂* |
|---|---|---|---|
| 1 | Label shift | −3.2 | 3.0 |
| 2 | Feature shift | 3.5 | 2.2 |
| 3 | Concept shift | 3.2 | −3.5 |

### 2. Client local minima markers

Add × or diamond markers at each client's local minimum θᵢ* using the coordinates above. Color-matched to the client arrows (blue / orange / green). Makes the geometry explicit: each client is descending toward a different target in parameter space.

Label each marker with the axis name (small, outside the contour region to avoid clutter).

## Implementation notes

- For the E-slider, use Svelte `$state` for `E` and `$derived` for client endpoint positions.
- The quadratic iterate formula above is exact for quadratic local losses; no need to simulate SGD steps.
- Keep SCAFFOLD arrow fixed across E values — its position is meant to show the corrected direction, not track a specific algorithm step.
- The legend should stay outside the Plot (current HTML div approach) to keep axes uncluttered.
- Learning rate α = 0.25 gives readable motion: at E=1 clients barely move; at E=10 they are ~93% of the way to their local minima.
