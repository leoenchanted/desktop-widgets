export const WORKSPACE_FX_MODES = [
  { value: 'galaxy', label: '星河' },
  { value: 'storm', label: '暴雨' },
  { value: 'matrix', label: '矩阵' },
  { value: 'magma', label: '岩浆' },
];

export const DEFAULT_WORKSPACE_FX_MODE = 'galaxy';
export const WORKSPACE_FX_MODE_VALUES = new Set(WORKSPACE_FX_MODES.map((mode) => mode.value));
