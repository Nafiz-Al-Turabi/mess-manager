import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_THEME_COLORS,
  THEME_PRESETS,
  adjustHexBrightness,
  loadStoredTheme,
} from './theme';

test('DEFAULT_THEME_COLORS has valid hex codes', () => {
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  assert.match(DEFAULT_THEME_COLORS.primary, hexRegex);
  assert.match(DEFAULT_THEME_COLORS.subDark, hexRegex);
  assert.match(DEFAULT_THEME_COLORS.accent, hexRegex);
  assert.match(DEFAULT_THEME_COLORS.highlight, hexRegex);
  assert.match(DEFAULT_THEME_COLORS.lime, hexRegex);
  assert.match(DEFAULT_THEME_COLORS.bg, hexRegex);
});

test('THEME_PRESETS contains at least 6 curated presets with unique IDs', () => {
  assert.ok(THEME_PRESETS.length >= 6);
  const ids = new Set(THEME_PRESETS.map((p) => p.id));
  assert.equal(ids.size, THEME_PRESETS.length);
});

test('adjustHexBrightness correctly adjusts color brightness', () => {
  const darkened = adjustHexBrightness('#173125', -15);
  assert.match(darkened, /^#[0-9a-f]{6}$/i);
  assert.notEqual(darkened, '#173125');
});

test('loadStoredTheme returns default theme in node environment', () => {
  const stored = loadStoredTheme();
  assert.equal(stored.presetId, 'pine-forest');
  assert.deepEqual(stored.colors, DEFAULT_THEME_COLORS);
});

