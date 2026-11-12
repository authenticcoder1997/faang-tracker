import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyTheme,
  DEFAULT_THEME,
  isValidTheme,
  normalizeTheme,
  THEME_MODES,
  THEME_PALETTES,
} from './theme.js';

test('legacy appearances keep the selected color and mode while glass becomes a standalone theme', () => {
  assert.deepEqual(normalizeTheme('light'), DEFAULT_THEME);
  assert.deepEqual(normalizeTheme('dark'), { ...DEFAULT_THEME, mode: 'dark' });
  assert.deepEqual(normalizeTheme('glass'), { mode: 'light', palette: 'glass' });
  const legacy = { mode: 'dark', palette: 'rose', material: 'glass' };
  assert.equal(isValidTheme(legacy), true);
  assert.deepEqual(normalizeTheme(legacy), { mode: 'dark', palette: 'rose' });
  assert.deepEqual(normalizeTheme({ ...legacy, selectedTheme: 'glass' }), { mode: 'dark', palette: 'glass' });
});

test('invalid cloud preferences fall back per field without losing valid choices', () => {
  for (const invalid of [undefined, null, 1, [], 'invalid', '__proto__']) {
    assert.deepEqual(normalizeTheme(invalid), DEFAULT_THEME);
    assert.equal(isValidTheme(invalid), false);
  }
  assert.deepEqual(normalizeTheme({ mode: 'dark', palette: 'unknown' }), {
    mode: 'dark',
    palette: 'neutral',
  });
  assert.deepEqual(normalizeTheme({ mode: 'invalid', palette: 'rose' }), {
    mode: 'light',
    palette: 'rose',
  });
  const invalidMaterial = { mode: 'dark', palette: 'ocean', material: 'unknown' };
  assert.equal(isValidTheme(invalidMaterial), false);
  assert.deepEqual(normalizeTheme(invalidMaterial), { mode: 'dark', palette: 'ocean' });
  assert.equal(isValidTheme({ ...DEFAULT_THEME, selectedTheme: 'unknown' }), false);
});

test('all six themes have both light and dark modes', () => {
  assert.equal(THEME_PALETTES.length, 6);
  for (const mode of THEME_MODES) {
    for (const palette of THEME_PALETTES) {
      const input = { mode, palette: 'neutral', selectedTheme: palette };
      assert.equal(isValidTheme(input), true);
      assert.deepEqual(normalizeTheme(input), { mode, palette });
    }
  }
});

test('applying preferences updates all appearance attributes and native controls', () => {
  const classes = new Set(['dark', 'other-class']);
  const root = {
    dataset: { theme: 'glass' },
    style: {},
    classList: {
      toggle(name, enabled) {
        if (enabled) classes.add(name);
        else classes.delete(name);
      },
    },
  };

  for (const mode of THEME_MODES) {
    for (const palette of THEME_PALETTES) {
      const input = { mode, palette };
      assert.deepEqual(applyTheme(input, root), input);
      assert.equal(root.dataset.theme, mode);
      assert.equal(root.dataset.palette, palette);
      assert.equal(classes.has('dark'), mode === 'dark');
      assert.equal(root.style.colorScheme, mode);
      assert.equal(classes.has('other-class'), true);
    }
  }
  assert.deepEqual(applyTheme('invalid', root), DEFAULT_THEME);
  assert.equal(root.dataset.theme, 'light');
  assert.equal(classes.has('dark'), false);
  assert.deepEqual(applyTheme({ mode: 'dark', palette: 'ocean' }, null), {
    mode: 'dark',
    palette: 'ocean',
  });
});
