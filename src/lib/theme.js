export const THEME_STORAGE_KEY = 'my-space-theme';
export const THEMES = ['light', 'dark', 'glass'];

export function isValidTheme(theme) {
  return THEMES.includes(theme);
}

/** Read browser preferences without making storage access a requirement. */
export function readTheme(
  browser = typeof window === 'undefined' ? null : window,
) {
  let storageError = false;

  try {
    const saved = browser?.localStorage?.getItem(THEME_STORAGE_KEY);
    if (isValidTheme(saved)) return { theme: saved, storageError };
  } catch {
    storageError = true;
  }

  try {
    if (typeof browser?.matchMedia === 'function') {
      return {
        theme: browser.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light',
        storageError,
      };
    }
  } catch {
    // An unavailable media query leaves a usable, deterministic default.
  }

  return { theme: 'dark', storageError };
}

export function applyTheme(
  theme,
  root = typeof document === 'undefined' ? null : document.documentElement,
) {
  const nextTheme = isValidTheme(theme) ? theme : 'dark';
  if (root) {
    root.dataset.theme = nextTheme;
    root.classList.toggle('dark', nextTheme === 'dark');
    root.style.colorScheme = nextTheme === 'dark' ? 'dark' : 'light';
  }
  return nextTheme;
}
