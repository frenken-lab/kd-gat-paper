import { Position, type InternalNode } from '@xyflow/svelte';

// Floating-edge geometry: pick the boundary point on each node closest to
// the line connecting the two centers, then snap to the nearest cardinal
// side. Replaces xyflow's static handle-side anchoring so edges leave/enter
// nodes from the side that actually faces the other endpoint.
//
// Ported from xyflow/xyflow examples/react/src/examples/FloatingEdges/utils.ts,
// with an added circle branch (their original assumes rectangular nodes).

interface NodeRect {
  cx: number;
  cy: number;
  w: number;
  h: number;
  isCircle: boolean;
}

function nodeRect(n: InternalNode): NodeRect {
  const w = n.measured?.width ?? 0;
  const h = n.measured?.height ?? 0;
  const cx = n.internals.positionAbsolute.x + w / 2;
  const cy = n.internals.positionAbsolute.y + h / 2;
  return { cx, cy, w, h, isCircle: n.type === 'circle' };
}

function intersection(node: NodeRect, target: NodeRect): { x: number; y: number } {
  const dx = target.cx - node.cx;
  const dy = target.cy - node.cy;
  const len = Math.hypot(dx, dy);
  if (len === 0 || node.w === 0 || node.h === 0) return { x: node.cx, y: node.cy };

  if (node.isCircle) {
    const r = Math.min(node.w, node.h) / 2;
    return { x: node.cx + (dx / len) * r, y: node.cy + (dy / len) * r };
  }

  // Rectangle: parametrically scale the (dx, dy) ray so it just touches the
  // axis-aligned bounding box, then take whichever axis binds first.
  const halfW = node.w / 2;
  const halfH = node.h / 2;
  const tx = dx === 0 ? Infinity : halfW / Math.abs(dx);
  const ty = dy === 0 ? Infinity : halfH / Math.abs(dy);
  const t = Math.min(tx, ty);
  return { x: node.cx + dx * t, y: node.cy + dy * t };
}

function snap(node: NodeRect, point: { x: number; y: number }): Position {
  if (node.isCircle) {
    const angle = Math.atan2(point.y - node.cy, point.x - node.cx) * (180 / Math.PI);
    if (angle >= -45 && angle < 45) return Position.Right;
    if (angle >= 45 && angle < 135) return Position.Bottom;
    if (angle >= -135 && angle < -45) return Position.Top;
    return Position.Left;
  }
  const dRight = Math.abs(point.x - (node.cx + node.w / 2));
  const dLeft = Math.abs(point.x - (node.cx - node.w / 2));
  const dTop = Math.abs(point.y - (node.cy - node.h / 2));
  const dBottom = Math.abs(point.y - (node.cy + node.h / 2));
  const m = Math.min(dRight, dLeft, dTop, dBottom);
  if (m === dRight) return Position.Right;
  if (m === dLeft) return Position.Left;
  if (m === dTop) return Position.Top;
  return Position.Bottom;
}

export interface FloatingEdgeParams {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  sourcePos: Position;
  targetPos: Position;
}

export function getEdgeParams(
  source: InternalNode,
  target: InternalNode,
): FloatingEdgeParams {
  const s = nodeRect(source);
  const t = nodeRect(target);
  const sIp = intersection(s, t);
  const tIp = intersection(t, s);
  return {
    sx: sIp.x,
    sy: sIp.y,
    tx: tIp.x,
    ty: tIp.y,
    sourcePos: snap(s, sIp),
    targetPos: snap(t, tIp),
  };
}

// Boundary intersection between an internal node and an external (x, y)
// point — used when feeding an edge a bend-point list from ELK and needing
// the actual cap on the leaf node toward the first/last bend point.
export function boundaryToward(
  node: InternalNode,
  toward: { x: number; y: number },
): { x: number; y: number } {
  const r = nodeRect(node);
  // Synthesize a fake target rect at the toward point so `intersection` can
  // do its dx/dy calculation.
  return intersection(r, { cx: toward.x, cy: toward.y, w: 0, h: 0, isCircle: false });
}

// Render an SVG path through a sequence of points with rounded corners at
// each interior point. Matches the orthogonal-with-rounded-corners look of
// xyflow's getSmoothStepPath but accepts arbitrary bend points (e.g. from
// ELK). Endpoints are the first/last points; corners are smoothed via
// quadratic bezier truncated by `radius` along each adjacent segment.
export function roundedPolylinePath(
  points: Array<{ x: number; y: number }>,
  radius = 8,
): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const inDx = curr.x - prev.x;
    const inDy = curr.y - prev.y;
    const outDx = next.x - curr.x;
    const outDy = next.y - curr.y;
    const inLen = Math.hypot(inDx, inDy);
    const outLen = Math.hypot(outDx, outDy);
    if (inLen === 0 || outLen === 0) continue;

    const r = Math.min(radius, inLen / 2, outLen / 2);
    const px = curr.x - (inDx / inLen) * r;
    const py = curr.y - (inDy / inLen) * r;
    const qx = curr.x + (outDx / outLen) * r;
    const qy = curr.y + (outDy / outLen) * r;

    d += ` L ${px} ${py} Q ${curr.x} ${curr.y} ${qx} ${qy}`;
  }
  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return d;
}
