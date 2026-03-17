'use strict';

// AI Enforce — post-generation style enforcement.
// reduce():        palette reduction via nearest-neighbor Euclidean RGB merging.
// detectOutline(): boundary pixel detection — sets outline to darkest palette color (O1).
// enforce():       entry point called after AI generation.

var AIEnforce = (function() {

    // ── Helpers ───────────────────────────────────────────────────────────────

    function _rgbToHex(r, g, b) {
        return '#' +
            ('0' + r.toString(16)).slice(-2).toUpperCase() +
            ('0' + g.toString(16)).slice(-2).toUpperCase() +
            ('0' + b.toString(16)).slice(-2).toUpperCase();
    }

    function _hexToRgb(hex) {
        return [
            parseInt(hex.slice(1, 3), 16),
            parseInt(hex.slice(3, 5), 16),
            parseInt(hex.slice(5, 7), 16)
        ];
    }

    function _nearestColor(r, g, b, keptRgb) {
        var best = null;
        var bestDist = Infinity;
        for (var j = 0; j < keptRgb.length; j++) {
            var dr = r - keptRgb[j][0];
            var dg = g - keptRgb[j][1];
            var db = b - keptRgb[j][2];
            var dist = dr * dr + dg * dg + db * db;
            if (dist < bestDist) {
                bestDist = dist;
                best = keptRgb[j];
            }
        }
        return best;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    // reduce(pixels, maxColors)
    // Scans the pixel array, keeps the top N colors by frequency,
    // remaps all other pixels to their nearest kept color.
    // Modifies pixels in-place. Returns true if any pixels were changed.
    function reduce(pixels, maxColors) {
        maxColors = maxColors || 6;

        // Count distinct opaque colors
        var colorMap = {};
        for (var i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] < 128) continue;
            var hex = _rgbToHex(pixels[i], pixels[i + 1], pixels[i + 2]);
            colorMap[hex] = (colorMap[hex] || 0) + 1;
        }

        var colors = Object.keys(colorMap);
        if (colors.length <= maxColors) return false;

        // Keep the most-used N colors
        colors.sort(function(a, b) { return colorMap[b] - colorMap[a]; });
        var kept    = colors.slice(0, maxColors);
        var keptSet = {};
        kept.forEach(function(h) { keptSet[h] = true; });
        var keptRgb = kept.map(_hexToRgb);

        // Remap pixels not in the kept set to their nearest kept color
        var changed = false;
        for (var j = 0; j < pixels.length; j += 4) {
            if (pixels[j + 3] < 128) continue;
            var hex = _rgbToHex(pixels[j], pixels[j + 1], pixels[j + 2]);
            if (keptSet[hex]) continue;

            var nearest = _nearestColor(pixels[j], pixels[j + 1], pixels[j + 2], keptRgb);
            pixels[j]     = nearest[0];
            pixels[j + 1] = nearest[1];
            pixels[j + 2] = nearest[2];
            changed = true;
        }

        return changed;
    }

    // detectOutline(pixels, w, h)
    // Finds every opaque pixel that has at least one transparent neighbor (boundary pixel)
    // and sets it to palette[0] — the darkest outline color.
    // Modifies pixels in-place. Returns true if any pixels were changed.
    function detectOutline(pixels, w, h) {
        // Collect the current palette by scanning opaque pixels
        var colorMap = {};
        for (var i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] < 128) continue;
            colorMap[_rgbToHex(pixels[i], pixels[i + 1], pixels[i + 2])] = true;
        }
        var palette = Object.keys(colorMap);
        if (palette.length === 0) return false;

        // Sort to find the darkest color (lowest R+G+B sum = darkest)
        palette.sort(function(a, b) {
            var ra = _hexToRgb(a), rb = _hexToRgb(b);
            return (ra[0] + ra[1] + ra[2]) - (rb[0] + rb[1] + rb[2]);
        });
        var outlineRgb = _hexToRgb(palette[0]);

        var changed = false;
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var idx = (y * w + x) * 4;
                if (pixels[idx + 3] < 128) continue; // skip transparent

                // Check 4-directional neighbors for transparency
                var isBoundary = false;
                var neighbors = [[x-1,y],[x+1,y],[x,y-1],[x,y+1]];
                for (var n = 0; n < 4; n++) {
                    var nx = neighbors[n][0], ny = neighbors[n][1];
                    if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
                        isBoundary = true; // edge of canvas = boundary
                        break;
                    }
                    var ni = (ny * w + nx) * 4;
                    if (pixels[ni + 3] < 128) { isBoundary = true; break; }
                }

                if (!isBoundary) continue;
                if (pixels[idx]     === outlineRgb[0] &&
                    pixels[idx + 1] === outlineRgb[1] &&
                    pixels[idx + 2] === outlineRgb[2]) continue; // already outline color

                pixels[idx]     = outlineRgb[0];
                pixels[idx + 1] = outlineRgb[1];
                pixels[idx + 2] = outlineRgb[2];
                changed = true;
            }
        }
        return changed;
    }

    // enforce(pixels, w, h, statusEl)
    // Entry point. Checks the artist toggle; if enabled, runs reduce().
    // If pixels changed: commits a new History entry and redraws.
    // Appends a note to statusEl if provided.
    function enforce(pixels, w, h, statusEl) {
        var toggle = document.getElementById('enforce-toggle');
        if (toggle && !toggle.checked) return;

        var reducedChanged = reduce(pixels);
        var outlineChanged = detectOutline(pixels, w, h);

        if (reducedChanged || outlineChanged) {
            PixelCanvas.pushToHistory(pixels);
            PixelCanvas.redraw();
            if (statusEl) {
                var note = [];
                if (reducedChanged) note.push('palette enforced');
                if (outlineChanged) note.push('outline applied');
                statusEl.textContent += ' · ' + note.join(' · ');
            }
        }
    }

    return { reduce, detectOutline, enforce };
})();
