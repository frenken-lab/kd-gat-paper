import type { DiagramData, ModelOutput } from './types.ts';

export interface KdConfig {
  label?: string;
}

/**
 * Merge a teacher and student model into a single diagram with a KD edge.
 * Concatenates all node/edge/box/container arrays and adds the distillation edge.
 */
export function mergeModels(
  teacher: ModelOutput,
  student: ModelOutput,
  config: KdConfig = {},
): DiagramData {
  const { label = 'KD' } = config;

  return {
    nodes: [...teacher.nodes, ...student.nodes],
    edges: [
      ...teacher.edges,
      ...student.edges,
      {
        source: teacher.kdId,
        target: student.kdId,
        type: 'kd' as const,
        color: 'kd',
        label,
      },
    ],
    boxes: [...teacher.boxes, ...student.boxes],
    containers: [...teacher.containers, ...student.containers],
  };
}
