import {
  Droplets,
  Flower2,
  Moon,
  Orbit,
  Sparkles,
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

  return (
    <div className="theme-switcher" aria-label="Appearance">
      <span className="theme-material-label">
        <Sparkles size={13} aria-hidden="true" />
        <span>Liquid Glass</span>
      </span>
      <div className="theme-mode-toggle" role="group" aria-label="Appearance mode">
        {[
          { id: 'light', label: 'Light Liquid Glass', Icon: Sun },
          { id: 'dark', label: 'Dark Liquid Glass', Icon: Moon },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className="theme-mode-button"
            aria-label={label}
            aria-pressed={appearance.mode === id}
            title={label}
            onClick={() => onChange({ ...appearance, mode: id })}
          >
            <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
          </button>
        ))}
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
            <span className="theme-palette-label">{label}</span>
          </button>
        ))}
      </div>
      {syncError && (
        <span className="sr-only" role="status">
          Your appearance has changed. Reconnect to save it to your account.
        </span>
      )}
    </div>
  );
}
