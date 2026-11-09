import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyTheme,
  DEFAULT_THEME,
  isValidTheme,
  normalizeTheme,
  THEME_MATERIALS,
  THEME_MODES,
  THEME_PALETTES,
} from './theme.js';

test('legacy appearance preferences migrate to the shared glass material', () => {
  assert.deepEqual(normalizeTheme('light'), DEFAULT_THEME);
  assert.deepEqual(normalizeTheme('dark'), { ...DEFAULT_THEME, mode: 'dark' });
  assert.deepEqual(normalizeTheme('glass'), DEFAULT_THEME);
  assert.deepEqual(normalizeTheme({ mode: 'dark', palette: 'rose' }), {
    mode: 'dark', palette: 'rose', material: 'glass',
  });
});

test('invalid cloud preferences fall back per field without losing valid choices', () => {
  for (const invalid of [undefined, null, 1, [], 'invalid', '__proto__']) {
    assert.deepEqual(normalizeTheme(invalid), DEFAULT_THEME);
    assert.equal(isValidTheme(invalid), false);
  }
  assert.deepEqual(normalizeTheme({ mode: 'dark', palette: 'unknown' }), {
    mode: 'dark',
    palette: 'neutral',
    material: 'glass',
  });
  assert.deepEqual(normalizeTheme({ mode: 'invalid', palette: 'rose' }), {
    mode: 'light',
    palette: 'rose',
    material: 'glass',
  });
  const invalidMaterial = { mode: 'dark', palette: 'ocean', material: 'unknown' };
  assert.equal(isValidTheme(invalidMaterial), false);
  assert.deepEqual(normalizeTheme(invalidMaterial), { ...invalidMaterial, material: 'glass' });
});

test('light and dark are independent of palette and material', () => {
  for (const mode of THEME_MODES) {
    for (const palette of THEME_PALETTES) {
      for (const material of THEME_MATERIALS) {
        const input = { mode, palette, material };
        assert.equal(isValidTheme(input), true);
        assert.deepEqual(normalizeTheme(input), input);
        assert.notEqual(normalizeTheme(input), input);
      }
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
      for (const material of THEME_MATERIALS) {
        const input = { mode, palette, material };
        assert.deepEqual(applyTheme(input, root), input);
        assert.equal(root.dataset.theme, mode);
        assert.equal(root.dataset.palette, palette);
        assert.equal(root.dataset.material, material);
        assert.equal(classes.has('dark'), mode === 'dark');
        assert.equal(root.style.colorScheme, mode);
        assert.equal(classes.has('other-class'), true);
      }
    }
  }
  assert.deepEqual(applyTheme('invalid', root), DEFAULT_THEME);
  assert.equal(root.dataset.theme, 'light');
  assert.equal(classes.has('dark'), false);
  assert.deepEqual(applyTheme({ mode: 'dark', palette: 'ocean' }, null), {
    mode: 'dark',
    palette: 'ocean',
    material: 'glass',
  });
});
