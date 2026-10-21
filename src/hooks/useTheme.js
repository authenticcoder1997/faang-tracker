import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyTheme,
  isValidTheme,
  readTheme,
  THEME_STORAGE_KEY,
} from '../lib/theme';

export function useTheme() {
  const [preference, setPreference] = useState(() => readTheme());
  const sessionChoice = useRef(false);

  useEffect(() => {
    applyTheme(preference.theme);
  }, [preference.theme]);

  const setTheme = useCallback((theme) => {
    if (!isValidTheme(theme)) return;
    sessionChoice.current = true;
    let storageError = false;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      storageError = true;
    }
    applyTheme(theme);
    setPreference({ theme, storageError });
  }, []);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
      sessionChoice.current = false;
      const next = readTheme();
      applyTheme(next.theme);
      setPreference(next);
    };
    window.addEventListener('storage', onStorage);

    // Follow the system until the user chooses an explicit saved preference.
    let media;
    const onSystemChange = () => {
      if (sessionChoice.current) return;
      try {
        if (isValidTheme(window.localStorage.getItem(THEME_STORAGE_KEY)))
          return;
      } catch {
        // The system preference remains usable if browser storage is disabled.
      }
      setPreference(readTheme());
    };
    try {
      media = window.matchMedia?.('(prefers-color-scheme: dark)');
      media?.addEventListener?.('change', onSystemChange);
    } catch {
      // Older browsers can still use all three explicit theme choices.
    }

    return () => {
      window.removeEventListener('storage', onStorage);
      media?.removeEventListener?.('change', onSystemChange);
    };
  }, []);

  return {
    theme: preference.theme,
    setTheme,
    storageError: preference.storageError,
  };
}
