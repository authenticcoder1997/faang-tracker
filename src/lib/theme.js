export const THEME_MODES = Object.freeze(['light', 'dark']);
export const THEME_PALETTES = Object.freeze([
  'neutral',
  'ocean',
  'violet',
  'rose',
  'amber',
]);
export const DEFAULT_THEME = Object.freeze({ mode: 'light', palette: 'neutral' });

/** Keep old preferences useful while giving every appearance the glass material. */
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
  };
}

export function isValidTheme(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    THEME_MODES.includes(value.mode) &&
    THEME_PALETTES.includes(value.palette)
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
    root.dataset.material = 'glass';
    root.classList.toggle('dark', theme.mode === 'dark');
    root.style.colorScheme = theme.mode;
  }
  return theme;
}
