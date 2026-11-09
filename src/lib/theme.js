export const THEME_MODES = Object.freeze(['light', 'dark']);
export const THEME_MATERIALS = Object.freeze(['glass', 'solid']);
export const THEME_PALETTES = Object.freeze([
  'neutral',
  'ocean',
  'violet',
  'rose',
  'amber',
]);
export const DEFAULT_THEME = Object.freeze({ mode: 'light', palette: 'neutral', material: 'glass' });

/** Existing preferences use glass until a material is selected. */
export function normalizeTheme(value) {
  if (typeof value === 'string') {
    return {
      ...DEFAULT_THEME,
      mode: value === 'dark' ? 'dark' : 'light',
    };
  }

  return {
    mode: THEME_MODES.includes(value?.mode) ? value.mode : DEFAULT_THEME.mode,
    palette: THEME_PALETTES.includes(value?.palette)
      ? value.palette
      : DEFAULT_THEME.palette,
    material: THEME_MATERIALS.includes(value?.material)
      ? value.material
      : DEFAULT_THEME.material,
  };
}

export function isValidTheme(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    THEME_MODES.includes(value.mode) &&
    THEME_PALETTES.includes(value.palette) &&
    (value.material === undefined || THEME_MATERIALS.includes(value.material))
  );
}

export function applyTheme(
  value,
  root = typeof document === 'undefined' ? null : document.documentElement,
) {
  const theme = normalizeTheme(value);
  if (root) {
    root.dataset.theme = theme.mode;
    root.dataset.palette = theme.palette;
    root.dataset.material = theme.material;
    root.classList.toggle('dark', theme.mode === 'dark');
    root.style.colorScheme = theme.mode;
  }
  return theme;
}
