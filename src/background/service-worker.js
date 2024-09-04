
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({ url: 'index.html' });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchUrl') {
        chrome.tabs.create({ url: request.url, active: false }, (tab) => {
            const tabId = tab.id;

            const listener = (details) => {
                if (details.tabId === tabId && details.frameId === 0) {
                    chrome.webNavigation.onCompleted.removeListener(listener);

                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        function: () => {
                            const metaKeywords = document.querySelector('meta[name$="keywords"]')?.content || '';
                            const metaTitle = document.querySelector('meta[name$="title"]')?.content || '';
                            const metaDescription = document.querySelector('meta[name$="description"]')?.content || '';
                            return { metaKeywords,metaTitle, metaDescription };
                        }
                    }, (results) => {
                        chrome.tabs.remove(tabId);
                        if (chrome.runtime.lastError) {
                            sendResponse({ error: chrome.runtime.lastError.message });
                        } else {
                            sendResponse({ data: results[0].result });
                        }
                    });
                }
            };

            chrome.webNavigation.onCompleted.addListener(listener);
        });
        return true;  // 保持消息通道开放
    }
});
