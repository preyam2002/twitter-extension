document.addEventListener('DOMContentLoaded', () => {
    const keyInput = document.getElementById('apiKey');
    const saveBtn = document.getElementById('saveBtn');
    const status = document.getElementById('status');

    // Load existing key
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
        if (result.geminiApiKey) {
            keyInput.value = result.geminiApiKey;
        }
    });

    // Save key
    saveBtn.addEventListener('click', () => {
        const apiKey = keyInput.value.trim();
        
        if (!apiKey) {
            alert('Please enter an API Key!');
            return;
        }

        chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
            status.style.display = 'block';
            setTimeout(() => {
                status.style.display = 'none';
            }, 2000);
            
            // Reload active tab to apply changes immediately
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && (tabs[0].url.includes("twitter.com") || tabs[0].url.includes("x.com"))) {
                    chrome.tabs.reload(tabs[0].id);
                }
            });
        });
    });
});
