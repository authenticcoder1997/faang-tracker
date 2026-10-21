import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTheme, readTheme, THEME_STORAGE_KEY } from './theme.js';

const browser = (saved, dark = false) => ({
  localStorage: {
    getItem(key) {
      assert.equal(key, THEME_STORAGE_KEY);
      return saved;
    },
  },
  matchMedia(query) {
    assert.equal(query, '(prefers-color-scheme: dark)');
    return { matches: dark };
  },
});

test('all valid saved themes take precedence over the system appearance', () => {
  for (const theme of ['light', 'dark', 'glass']) {
    assert.deepEqual(readTheme(browser(theme, theme === 'light')), {
      theme,
      storageError: false,
    });
  }
});

test('missing and invalid saved preferences follow the system appearance', () => {
  for (const saved of [null, '', 'sepia', '"dark"', '__proto__']) {
    assert.equal(readTheme(browser(saved, true)).theme, 'dark');
    assert.equal(readTheme(browser(saved, false)).theme, 'light');
  }
});

test('blocked storage retains system preference and reports the saving limitation', () => {
  const blocked = browser(null, false);
  Object.defineProperty(blocked, 'localStorage', {
    get() {
      throw new Error('Storage disabled');
    },
  });
  assert.deepEqual(readTheme(blocked), { theme: 'light', storageError: true });
});

test('unavailable system appearance and non-browser contexts use dark', () => {
  assert.deepEqual(readTheme(null), { theme: 'dark', storageError: false });
  assert.deepEqual(readTheme({}), { theme: 'dark', storageError: false });
  assert.equal(
    readTheme({
      matchMedia() {
        throw new Error('Unavailable');
      },
    }).theme,
    'dark',
  );
});

test('applying a theme updates native controls and clears stale dark classes', () => {
  const classes = new Set(['dark', 'other-class']);
  const root = {
    dataset: {},
    style: {},
    classList: {
      toggle(name, enabled) {
        if (enabled) classes.add(name);
        else classes.delete(name);
      },
    },
  };

  for (const theme of ['glass', 'dark', 'light']) {
    assert.equal(applyTheme(theme, root), theme);
    assert.equal(root.dataset.theme, theme);
    assert.equal(classes.has('dark'), theme === 'dark');
    assert.equal(root.style.colorScheme, theme === 'dark' ? 'dark' : 'light');
    assert.equal(classes.has('other-class'), true);
  }
  assert.equal(applyTheme('invalid', root), 'dark');
  assert.equal(root.dataset.theme, 'dark');
  assert.equal(applyTheme('glass', null), 'glass');
});
