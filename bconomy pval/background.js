/* discord: @programmingdumpster */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "requestApiKey") {
        chrome.storage.sync.get('bconomyApiKey', (data) => {
            sendResponse({ apiKey: data.bconomyApiKey });
        });
        return true; 
    }
});