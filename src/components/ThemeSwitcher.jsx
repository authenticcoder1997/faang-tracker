import {
  Droplets,
  Flower2,
  Moon,
  Orbit,
  Sun,
  Sunset,
  Waves,
} from 'lucide-react';
import { normalizeTheme } from '../lib/theme';

const palettes = [
  { id: 'neutral', label: 'Silver', Icon: Droplets },
  { id: 'ocean', label: 'Ocean', Icon: Waves },
  { id: 'violet', label: 'Iris', Icon: Orbit },
  { id: 'rose', label: 'Rose', Icon: Flower2 },
  { id: 'amber', label: 'Amber', Icon: Sunset },
];

export default function ThemeSwitcher({ theme, onChange, syncError = false }) {
  const appearance = normalizeTheme(theme);
  const isDark = appearance.mode === 'dark';
  const ModeIcon = isDark ? Moon : Sun;

  return (
    <div className="theme-switcher" aria-label="Appearance">
      <div className="theme-mode-toggle">
        <button
          type="button"
          role="switch"
          className="theme-mode-button"
          aria-label="Dark mode"
          aria-checked={isDark}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          onClick={() => onChange({ ...appearance, mode: isDark ? 'light' : 'dark' })}
        >
          <span className="theme-mode-thumb">
            <ModeIcon size={15} strokeWidth={1.8} aria-hidden="true" />
          </span>
        </button>
      </div>
      <span className="theme-control-divider" aria-hidden="true" />
      <div className="theme-palette-rail" role="group" aria-label="Glass color">
        {palettes.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`theme-palette-button theme-palette-${id}`}
            aria-label={`${label} glass`}
            aria-pressed={appearance.palette === id}
            title={`${label} glass`}
            onClick={() => onChange({ ...appearance, palette: id })}
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
