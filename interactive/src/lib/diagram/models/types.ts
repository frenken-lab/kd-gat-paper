export interface DiagramNode {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  group?: string;
}

export interface DiagramEdge {
  source: string;
  target: string;
  type: 'structural' | 'encoded' | 'flow' | 'kd' | 'annotation';
  color?: string;
  weight?: number;
  label?: string;
}

export interface DiagramBox {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  width?: number;
  height?: number;
}

export interface DiagramContainer {
  group: string;
  label: string;
  color: string;
}

export interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  boxes: DiagramBox[];
  containers: DiagramContainer[];
}

export interface ModelOutput extends DiagramData {
  /** Node or box ID used for KD edge wiring */
  kdId: string;
}

export type Topology = 'sparse' | 'full' | 'none';
export type Labels = string[] | 'auto' | 'none';
export type Position = [number, number];
