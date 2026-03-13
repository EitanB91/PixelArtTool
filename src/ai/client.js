'use strict';

// AI Client — thin wrapper around the Anthropic SDK via fetch
// (Electron renderer cannot require() native modules, so we call the API directly via fetch)

var AIClient = (function() {
    var _apiKey = null;

    async function init() {
        _apiKey = await window.api.getApiKey();
        return !!_apiKey;
    }

    async function chat(messages, maxTokens) {
        if (!_apiKey) throw new Error('No ANTHROPIC_API_KEY. Add it to .env');
        maxTokens = maxTokens || 1024;

        var response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type':      'application/json',
                'x-api-key':         _apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model:      'claude-opus-4-6',
                max_tokens: maxTokens,
                messages:   messages
            })
        });

        if (!response.ok) {
            var err = await response.text();
            throw new Error('API error ' + response.status + ': ' + err);
        }

        var data = await response.json();
        return data.content[0].text;
    }

    function hasKey() { return !!_apiKey; }

    return { init, chat, hasKey };
})();
