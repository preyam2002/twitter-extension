// background.js - Handles API calls to bypass CORS/CSP issues

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generateReply") {
    handleReplyGeneration(request, sendResponse);
    return true; // Indicates we will respond asynchronously
  }
});

async function handleReplyGeneration(request, sendResponse) {
  const { apiKey, tweetText } = request;

  if (!apiKey) {
    sendResponse({ error: "API Key missing" });
    return;
  }

  const prompt = `
    You are a friendly, casual Twitter user. 
    Read this tweet and write a short, engaging reply (under 240 chars).
    Do not use hashtags. Do not sound like a bot. Be conversational.
    
    Tweet: "${tweetText}"
    
    Reply:
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (data.error) {
      sendResponse({ error: data.error.message });
    } else if (data.candidates && data.candidates[0].content) {
      const reply = data.candidates[0].content.parts[0].text.trim();
      sendResponse({ success: true, reply: reply });
    } else {
      sendResponse({ error: "No response from AI." });
    }
  } catch (error) {
    sendResponse({ error: error.message });
  }
}
