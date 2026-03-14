'use strict';

// AI Generate — takes a text prompt + optional reference image and describes
// a pixel art sprite as a color grid, then paints it onto the canvas.

var AIGenerate = (function() {

    var SYSTEM_PROMPT = `You are a pixel art sprite generator for a retro arcade game.

── ARTISTIC VISION ──────────────────────────────────────────────────────────

Before placing a single pixel, ask: does the silhouette alone tell the story?
A knight should read as a knight. A mushroom should read as a mushroom. If the
shape is ambiguous, the sprite has failed — no amount of color detail rescues a
broken silhouette.

Use the darkest color as the outline. The outline is not decoration — it is the
skeleton. It separates the sprite from the background and gives it weight. Every
boundary pixel between the character and empty space should carry the outline color.

Visual weight and pose matter. A character standing straight is boring. A slight
lean, a raised weapon, a crouched stance — these communicate personality in 16×22
pixels. Use your limited canvas to make the pose say something.

Palette discipline is not a constraint — it is the aesthetic. Pixel art at this
scale lives and dies by restraint. Use 2–4 colors for the main body. Reserve a
highlight color for the single most important surface catch. Reserve a mid-tone for
shadow. Never use more than 6 colors total. If you need more, you are painting, not
making pixel art.

Pixel art is impressionism: at this scale, you are not drawing reality — you are
drawing the idea of something. Every pixel must earn its place.

Now translate that artistic thinking into the following exact structure:

── OUTPUT FORMAT ─────────────────────────────────────────────────────────────

Return ONLY a valid JSON object. No explanation. No markdown fences. No text before
or after. The entire response must be parseable by JSON.parse().

Schema:
{
  "w": <integer — sprite width in pixels>,
  "h": <integer — sprite height in pixels>,
  "palette": ["#RRGGBB", ...],
  "grid": [[paletteIndex or null, ...], ...]
}

Rules:
- palette[0] is ALWAYS the darkest outline color (e.g. "#1A1A1A").
- palette has 2–6 entries. Never more than 6.
- grid has exactly h rows. Each row has exactly w values.
- Each grid value is a palette index (0–5) or null (transparent pixel).
- Dimensions must match the requested sprite size exactly.

One-shot example (4×4 sprite, 3 colors):
{"w":4,"h":4,"palette":["#1A1A1A","#D44000","#F0A000"],"grid":[[null,0,0,null],[0,1,2,0],[0,1,1,0],[null,0,0,null]]}`;

    async function run(prompt, w, h, referenceBase64, referenceExt, statusEl) {
        if (!AIClient.hasKey()) {
            statusEl.textContent = 'No API key. Add ANTHROPIC_API_KEY to .env';
            return;
        }

        statusEl.textContent = 'Generating...';

        var userContent = [];

        // Optional reference image
        if (referenceBase64) {
            userContent.push({
                type: 'image',
                source: {
                    type:       'base64',
                    media_type: 'image/' + (referenceExt || 'png'),
                    data:       referenceBase64
                }
            });
        }

        userContent.push({
            type: 'text',
            text: 'Sprite description: ' + prompt + '\nSprite size: ' + w + '×' + h + ' pixels.'
        });

        // Adaptive maxTokens: each cell ~4 chars + palette + structure overhead
        var maxTokens = Math.min(4096, Math.max(1024, w * h * 6 + 512));

        try {
            var responseText = await AIClient.chat([
                { role: 'user', content: userContent }
            ], maxTokens, SYSTEM_PROMPT);

            // Strip markdown fences if the model wrapped the JSON anyway
            var cleaned = responseText.trim();
            if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/^```[a-z]*\n?/, '').replace(/```$/, '').trim();
            }

            var parsed = JSON.parse(cleaned);

            // Schema validation before touching the canvas
            if (typeof parsed.w !== 'number' || typeof parsed.h !== 'number' ||
                !Array.isArray(parsed.palette) || !Array.isArray(parsed.grid)) {
                throw new Error('Invalid sprite schema: missing w, h, palette, or grid');
            }
            if (parsed.palette.length < 1 || parsed.palette.length > 6) {
                throw new Error('Invalid palette length: ' + parsed.palette.length + ' (expected 1–6)');
            }
            if (parsed.grid.length !== parsed.h) {
                throw new Error('Grid row count ' + parsed.grid.length + ' does not match h=' + parsed.h);
            }

            statusEl.textContent = 'Done — ' + parsed.palette.length + ' colors';
            _applyGrid(parsed, statusEl);

        } catch(e) {
            statusEl.textContent = 'Error: ' + e.message;
            console.error(e);
        }
    }

    function _applyGrid(data, statusEl) {
        var w = data.w;
        var h = data.h;
        var palette = data.palette;
        var grid    = data.grid;

        // Add all palette colors to the Palette module
        palette.forEach(function(hex) { Palette.addColor(hex); });
        if (window.PalettePanel) PalettePanel.refresh();

        // Resize canvas if needed
        var cw = PixelCanvas.getWidth();
        var ch = PixelCanvas.getHeight();
        if (cw !== w || ch !== h) {
            PixelCanvas.resize(w, h);
            document.getElementById('canvas-w').value = w;
            document.getElementById('canvas-h').value = h;
        }

        // Get direct reference to the live pixel array
        var pixels = PixelCanvas.getPixels();

        // Zero all pixels in-place (avoids PixelCanvas.clear() which pushes an
        // unwanted empty state to History and replaces the _pixels reference)
        for (var ci = 0; ci < pixels.length; ci++) pixels[ci] = 0;

        // Write grid data directly into the pixel array
        for (var py = 0; py < Math.min(h, PixelCanvas.getHeight()); py++) {
            for (var px = 0; px < Math.min(w, PixelCanvas.getWidth()); px++) {
                var idx = grid[py] ? grid[py][px] : null;
                if (idx !== null && idx !== undefined && palette[idx]) {
                    var i = (py * PixelCanvas.getWidth() + px) * 4;
                    var rgb = _hexToRgb(palette[idx]);
                    pixels[i]     = rgb[0];
                    pixels[i + 1] = rgb[1];
                    pixels[i + 2] = rgb[2];
                    pixels[i + 3] = 255;
                }
            }
        }

        // Single history commit + redraw
        History.push(pixels);
        PixelCanvas.redraw();

        // Style enforcement (auto, unless artist toggled off)
        AIEnforce.enforce(pixels, w, h, statusEl);
    }

    function _hexToRgb(hex) {
        return [
            parseInt(hex.slice(1, 3), 16),
            parseInt(hex.slice(3, 5), 16),
            parseInt(hex.slice(5, 7), 16)
        ];
    }

    async function trace(w, h, referenceBase64, referenceExt, statusEl) {
        if (!referenceBase64) {
            statusEl.textContent = 'Load a reference image first';
            return;
        }
        statusEl.textContent = 'Tracing...';
        try {
            var pixelData = await window.api.traceReference(referenceBase64, referenceExt || 'png', w, h);

            if (PixelCanvas.getWidth() !== w || PixelCanvas.getHeight() !== h) {
                PixelCanvas.resize(w, h);
                document.getElementById('canvas-w').value = w;
                document.getElementById('canvas-h').value = h;
            }

            var pixels = PixelCanvas.getPixels();
            for (var i = 0; i < pixels.length && i < pixelData.length; i++) {
                pixels[i] = pixelData[i];
            }

            History.push(pixels);
            PixelCanvas.redraw();
            statusEl.textContent = 'Traced';
            AIEnforce.enforce(pixels, w, h, statusEl);

        } catch(e) {
            statusEl.textContent = 'Error: ' + e.message;
            console.error(e);
        }
    }

    return { run, trace };
})();
