// Color palette from data/styles.yaml (Observable 10, colorblind-friendly)

export interface ColorPair {
  stroke: string;
  fill: string;
}

const palette: Record<string, string> = {
  blue:   '#4E79A7',
  orange: '#F28E2B',
  green:  '#59A14F',
  red:    '#E15759',
  teal:   '#76B7B2',
  purple: '#B07AA1',
  pink:   '#FF9DA7',
  brown:  '#9C755F',
  yellow: '#EDC948',
  grey:   '#BAB0AC',
};

// Light fills (15% opacity of base over white)
const fills: Record<string, string> = {
  blue:   '#DAE3EF',
  orange: '#FDE8D0',
  green:  '#D7E8D3',
  red:    '#F8D3D4',
  teal:   '#D9EDEB',
  purple: '#E6D9E1',
};

// Semantic roles → palette color names
const roles: Record<string, string> = {
  vgae:      'blue',
  gat:       'orange',
  dqn:       'green',
  kd:        'red',
  data:      'teal',
  normal:    'blue',
  attack:    'red',
  attention: 'purple',
};

/** Resolve a role name, palette color, or hex string to {stroke, fill}. */
export function resolve(name: string | undefined): ColorPair {
  if (!name) return { stroke: palette.grey, fill: palette.grey + '40' };
  const base = roles[name] || name;
  const s = palette[base];
  if (s) return { stroke: s, fill: fills[base] || s + '40' };
  // Raw hex or CSS color — pass through
  return { stroke: name, fill: name + '40' };
}
