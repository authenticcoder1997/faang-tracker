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

test('legacy appearance preferences migrate to the shared glass material', () => {
  assert.deepEqual(normalizeTheme('light'), { mode: 'light', palette: 'neutral' });
  assert.deepEqual(normalizeTheme('dark'), { mode: 'dark', palette: 'neutral' });
  assert.deepEqual(normalizeTheme('glass'), { mode: 'light', palette: 'neutral' });
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
});

test('light and dark are independent of every glass palette', () => {
  for (const mode of THEME_MODES) {
    for (const palette of THEME_PALETTES) {
      const input = { mode, palette };
      assert.equal(isValidTheme(input), true);
      assert.deepEqual(normalizeTheme(input), input);
      assert.notEqual(normalizeTheme(input), input);
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
      assert.deepEqual(applyTheme({ mode, palette }, root), { mode, palette });
      assert.equal(root.dataset.theme, mode);
      assert.equal(root.dataset.palette, palette);
      assert.equal(root.dataset.material, 'glass');
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
