import { useCallback, useLayoutEffect } from 'react';
import { applyTheme, DEFAULT_THEME } from '../lib/theme';
import { useWorkspace, useWorkspaceValue } from './useWorkspace';

export function useTheme() {
  const { updateData } = useWorkspace();
  const theme = useWorkspaceValue((state) => state.data?.appearance ?? DEFAULT_THEME);

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback(
    (changes) => updateData((current) => ({
      ...current,
      appearance: { ...current.appearance, ...changes },
    })),
    [updateData],
  );

  return { theme, setTheme };
}
