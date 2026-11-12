import {
  Flame,
  Gem,
  Layers2,
  Moon,
  Orbit,
  Snowflake,
  Sun,
  Zap,
} from 'lucide-react';
import { normalizeTheme } from '../lib/theme';

const palettes = [
  { id: 'glass', label: 'Liquid Glass', Icon: Layers2 },
  { id: 'neutral', label: 'Frost', Icon: Snowflake },
  { id: 'ocean', label: 'Voltage', Icon: Zap },
  { id: 'violet', label: 'After Hours', Icon: Orbit },
  { id: 'rose', label: 'Velvet', Icon: Gem },
  { id: 'amber', label: 'Ember', Icon: Flame },
];

export default function ThemeSwitcher({ theme, onChange, syncError = false, disabled = false }) {
  const appearance = normalizeTheme(theme);
  const isDark = appearance.mode === 'dark';
  const ModeIcon = isDark ? Moon : Sun;

  return (
    <div className="theme-switcher" aria-label="Appearance">
      <button
        type="button"
        disabled={disabled}
        role="switch"
        className="theme-mode-button"
        aria-label="Dark mode"
        aria-checked={isDark}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        onClick={() => onChange({ mode: isDark ? 'light' : 'dark' })}
      >
        <ModeIcon size={15} strokeWidth={1.8} aria-hidden="true" />
      </button>
      <span className="theme-control-divider" aria-hidden="true" />
      <div className="theme-palette-rail" role="group" aria-label="Themes">
        {palettes.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            disabled={disabled}
            className="theme-palette-button"
            data-swatch={id}
            aria-label={label}
            aria-pressed={appearance.palette === id}
            title={label}
            onClick={() => onChange({ selectedTheme: id })}
          >
            <span className="theme-palette-swatch">
              <Icon size={13} strokeWidth={1.8} aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>
      {syncError && (
        <span className="sr-only" role="status">
          Your appearance has changed. Reconnect to save it to Firebase.
        </span>
      )}
    </div>
  );
}
