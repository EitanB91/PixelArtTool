'use strict';

var OutputPanel = (function() {
    function init() {
        document.getElementById('btn-export').addEventListener('click', function() {
            var funcName = document.getElementById('func-name').value.trim() || '_drawSprite';
            var useLoff  = document.getElementById('use-loff').checked;
            var code     = Exporter.generate(funcName, useLoff);
            var out = document.getElementById('export-output');
            out.value = code;
            document.getElementById('btn-copy-code').style.display = 'inline-block';
        });

        document.getElementById('btn-copy-code').addEventListener('click', async function() {
            var code = document.getElementById('export-output').value;
            await window.api.copyToClipboard(code);
            this.textContent = 'Copied!';
            var btn = this;
            setTimeout(function() { btn.textContent = 'Copy to Clipboard'; }, 1500);
        });

        document.getElementById('btn-save-png').addEventListener('click', async function() {
            var funcName = document.getElementById('func-name').value.trim() || 'sprite';
            var b64      = PixelCanvas.toPngBase64();
            var saved    = await window.api.savePng(b64, funcName + '.png');
            if (saved) {
                this.textContent = 'Saved!';
                var btn = this;
                setTimeout(function() { btn.textContent = 'Save PNG'; }, 1500);
            }
        });
    }

    return { init };
})();
