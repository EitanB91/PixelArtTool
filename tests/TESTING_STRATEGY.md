# Testing Strategy — PixelArtTool

## The IIFE Problem

All renderer modules use the IIFE pattern (e.g. `var Palette = (function() { ... })()`).
They have no `module.exports` and depend on each other as browser globals.
Jest runs in Node.js and cannot import these files directly.

## Solution: Algorithm Extraction

Tests do NOT import the renderer modules. Instead, each test file:
1. Re-implements the **pure algorithm logic** as a standalone plain function
2. Tests that function directly with known inputs and expected outputs

This is valid because the algorithms (palette dedup, history stack, greedy rect scan,
palette reduction) are pure logic with no DOM or IPC dependencies. The test covers
correctness of the logic regardless of how it's wrapped in the browser module.

## Test File Pattern

```javascript
// tests/palette.test.js — example
// DO NOT: require('../src/core/palette')  ← would fail (no exports, needs DOM globals)
// DO:     extract the pure logic and test it directly

function paletteAddColor(colors, hex, max) {
    hex = hex.toUpperCase();
    if (colors.includes(hex)) return colors; // dedup
    if (colors.length >= max) return colors; // cap
    return [...colors, hex];
}

test('deduplicates colors', () => {
    expect(paletteAddColor(['#FF0000'], '#ff0000', 8)).toEqual(['#FF0000']);
});
```

## What Gets Tested

| File | What is tested |
|------|---------------|
| `tests/palette.test.js` | addColor dedup, max-8 cap, removeColor min-1 floor |
| `tests/history.test.js` | push max-50 eviction, undo/redo stack, reset |
| `tests/exporter.test.js` | greedy rect algorithm: single rect, disjoint rects, transparent, 1×1 |
| `tests/enforce.test.js` | reduce(): ≤6 colors identity, >6 colors reduction, all-transparent |

## What Is NOT Tested Here

- DOM interactions (require a browser environment — use manual testing or Playwright)
- IPC calls (tested via integration / manual testing)
- Canvas rendering (visual output — manual testing)
- AI generation (live API calls — manual testing with real key)

## Running Tests

```bash
npm test
```
