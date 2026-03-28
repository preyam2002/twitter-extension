// content.js - Fixed Version

alert("AI Copilot: Script Loaded!");
console.log("AI Copilot: Script started!");

let apiKey = "TEST_KEY_123"; // HARDCODED FOR TESTING

function loadApiKey() {
    // Try sync storage first
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
        if (result.geminiApiKey) {
            apiKey = result.geminiApiKey;
            console.log("AI Copilot: API Key loaded from SYNC.");
            showToast("AI Copilot Ready! (Key Loaded)");
        } else {
            // Try local storage as fallback
            chrome.storage.local.get(['geminiApiKey'], (localResult) => {
                if (localResult.geminiApiKey) {
                    apiKey = localResult.geminiApiKey;
                    console.log("AI Copilot: API Key loaded from LOCAL.");
                    showToast("AI Copilot Ready! (Key Loaded)");
                } else {
                    console.warn("AI Copilot: No API Key found.");
                    showToast("Please set your API Key in the extension!");
                }
            });
        }
    });
}

loadApiKey();

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
    if (changes.geminiApiKey) {
        apiKey = changes.geminiApiKey.newValue;
        console.log("AI Copilot: API Key updated via storage listener.");
        showToast("API Key Updated!");
    }
});

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = '#1DA1F2';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    toast.style.zIndex = '9999';
    toast.style.fontFamily = 'sans-serif';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

function simulateTyping(element, text) {
    if (!element) return;
    element.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, text);
    ['input', 'change', 'textInput'].forEach(eventType => {
        element.dispatchEvent(new Event(eventType, { bubbles: true, cancelable: true }));
    });
}

function waitForElement(selector, callback, attempts = 0) {
    const el = document.querySelector(selector);
    if (el) {
        callback(el);
        return;
    }
    if (attempts > 50) return;
    setTimeout(() => waitForElement(selector, callback, attempts + 1), 100);
}

function processTweets() {
    const actionBars = document.querySelectorAll('[role="group"]');
    
    if (actionBars.length === 0) return;

    actionBars.forEach(actionBar => {
        if (actionBar.dataset.aiProcessed) return;

        const tweetArticle = actionBar.closest('article');
        if (!tweetArticle) return;

        const aiButton = document.createElement('div');
        aiButton.innerHTML = `
            <div role="button" tabindex="0" class="css-18t94o4 css-1dbjc4n r-1777fci r-bt1l66 r-1ny4l3l r-bztko3 r-lrvibr" 
                 style="display: flex; align-items: center; justify-content: center; cursor: pointer; margin-left: 12px; height: 34px; width: 34px; border-radius: 9999px; transition: background 0.2s;" 
                 title="AI Suggest Reply">
                <span style="font-size: 18px;">✨</span>
            </div>
        `;
        
        aiButton.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            if (!apiKey) {
                alert("Please set your Gemini API Key first! (Click extension icon -> Save -> Reload page)");
                return;
            }

            const textElement = tweetArticle.querySelector('[data-testid="tweetText"]');
            const tweetText = textElement ? textElement.innerText : "";
            
            if (!tweetText) {
                alert("Could not read tweet text!");
                return;
            }

            const icon = aiButton.querySelector('span');
            icon.innerText = "⏳";
            
            chrome.runtime.sendMessage({
                action: "generateReply",
                apiKey: apiKey,
                tweetText: tweetText
            }, (response) => {
                icon.innerText = "✨";
                
                if (response && response.success) {
                    const replyText = response.reply;
                    const replyIcon = actionBar.querySelector('[data-testid="reply"]');
                    if (replyIcon) {
                        replyIcon.click();
                        waitForElement('[data-testid="tweetTextarea_0"]', (textarea) => {
                            simulateTyping(textarea, replyText);
                        });
                    }
                } else {
                    alert("AI Error: " + (response ? response.error : "Unknown"));
                }
            });
        });

        actionBar.appendChild(aiButton);
        actionBar.dataset.aiProcessed = "true";
    });
}

const observer = new MutationObserver((mutations) => {
    processTweets();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

processTweets();
