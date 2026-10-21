import { useId } from 'react';
import { Moon, Sparkles, Sun } from 'lucide-react';

const icons = { light: Sun, dark: Moon, glass: Sparkles };

export default function ThemeSwitcher({
  theme,
  onChange,
  storageError = false,
}) {
  const messageId = useId();
  const Icon = icons[theme] || Moon;

  return (
    <div className="theme-switcher flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2">
      <Icon size={15} aria-hidden="true" className="hidden sm:block" />
      <select
        aria-label="Theme"
        aria-describedby={storageError ? messageId : undefined}
        className="theme-control min-w-0 cursor-pointer rounded-md text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500"
        value={theme}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="glass">Liquid Glass</option>
      </select>
      {storageError && (
        <span id={messageId} className="sr-only" role="status">
          Theme applies here, but this browser could not save your preference.
        </span>
      )}
    </div>
  );
}
