import { useCallback, useLayoutEffect } from 'react';
import { applyTheme, DEFAULT_THEME, isValidTheme } from '../lib/theme';
import { useWorkspace, useWorkspaceValue } from './useWorkspace';

export function useTheme() {
  const { updateData } = useWorkspace();
  const theme = useWorkspaceValue((state) => state.data?.appearance ?? DEFAULT_THEME);

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback(
    (theme) => {
      if (!isValidTheme(theme)) return false;
      return updateData((current) => ({ ...current, appearance: theme }));
    },
    [updateData],
  );

  return { theme, setTheme };
}
