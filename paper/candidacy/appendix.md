---
title: "Appendix"
---

(app:pinn-physics)=
## Appendix: Physics Constraints

**Vehicle Dynamics Model:**

We model vehicle motion using a nonlinear bicycle model augmented with tire dynamics:

```{math}
\begin{aligned}
\dot{v}_x &= a_x - \frac{1}{m}(f_y^f \sin(\delta) + f_y^r) \\
\dot{v}_y &= \frac{1}{m}(f_y^f \cos(\delta) + f_y^r) - v_x \dot{\psi} \\
\dot{\psi} &= \frac{1}{I_z}(l_f f_y^f \cos(\delta) - l_r f_y^r)
\end{aligned}
```

where $m$ is mass, $f_y^f, f_y^r$ are tire lateral forces (estimated via Pacejka model), $l_f, l_r$ are axle distances, $I_z$ is yaw inertia, and $\delta$ is steering angle.

**Physics Loss Terms:**

```{math}
\begin{aligned}
L_{\text{vx}} &= \mathbb{E}\left[\left(\frac{\partial \hat{v}_x}{\partial t} - a_x^{\text{cmd}}\right)^2\right] \\
L_{\text{vy}} &= \mathbb{E}\left[\left(\frac{\partial \hat{v}_y}{\partial t} - v_x \dot{\psi}\right)^2\right] \\
L_{\text{yaw}} &= \mathbb{E}\left[\left(\frac{\partial \hat{\psi}}{\partial t} - \dot{\psi}\right)^2\right]
\end{aligned}
```
