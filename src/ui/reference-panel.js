'use strict';

var ReferencePanel = (function() {
    function init() {
        document.getElementById('btn-load-ref').addEventListener('click', async function() {
            var result = await window.api.openImage();
            if (!result) return;
            var allowed = ['png', 'jpg', 'jpeg', 'gif'];
            if (!allowed.includes(result.ext)) return;
            var img = document.getElementById('reference-img');
            var placeholder = document.getElementById('reference-placeholder');
            var ext = result.ext === 'jpg' ? 'jpeg' : result.ext;
            img.src = 'data:image/' + ext + ';base64,' + result.base64;
            img.style.display = 'block';
            placeholder.style.display = 'none';
            // Store base64 for AI panel use
            AppState.referenceBase64 = result.base64;
            AppState.referenceExt    = ext;
            document.getElementById('btn-extract-palette').disabled = false;
        });

        document.getElementById('btn-extract-palette').addEventListener('click', async function() {
            if (!AppState.referenceBase64) return;
            var btn = this;
            btn.disabled = true;
            try {
                var colors = await window.api.extractPalette(AppState.referenceBase64, AppState.referenceExt || 'png');
                Palette.reset();
                colors.forEach(function(hex) { Palette.addColor(hex); });
                if (window.PalettePanel) PalettePanel.refresh();
                if (window.Toolbar) Toolbar.refreshColorSwatch();
            } catch(e) {
                console.error('Extract palette failed:', e);
            } finally {
                btn.disabled = false;
            }
        });
    }

    function clearReference() {
        AppState.referenceBase64 = null;
        AppState.referenceExt    = null;
        var img = document.getElementById('reference-img');
        var placeholder = document.getElementById('reference-placeholder');
        img.removeAttribute('src');
        img.style.display = 'none';
        placeholder.style.display = '';
        document.getElementById('btn-extract-palette').disabled = true;
    }

    return { init, clearReference };
})();
