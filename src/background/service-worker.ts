// import DBManager from '../common/dbManager.ts';

// const dbManager = new DBManager();
// 监听扩展安装或更新事件
// chrome.runtime.onInstalled.addListener(() => {
//     console.log("Bookmark Extender 插件已安装");
//     dbManager.initDatabase().then(() => {
//         console.log("数据库初始化完成");
//     }).catch((error) => {
//         console.error("数据库初始化失败", error);
//     });
// });

// 监听扩展图标点击事件
chrome.action.onClicked.addListener((tab: chrome.tabs.Tab) => {
    chrome.tabs.create({ url: 'index.html' });
});

// 监听消息事件
chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    if (request.action === 'fetchUrl') {
        chrome.tabs.create({ url: request.url, active: false }, (tab: chrome.tabs.Tab) => {
            const tabId = tab.id;

            if (tabId !== undefined) {
                const listener = (details: chrome.webNavigation.WebNavigationFramedCallbackDetails) => {
                    if (details.tabId === tabId && details.frameId === 0) {
                        chrome.webNavigation.onCompleted.removeListener(listener);

                        chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            function: () => {
                                const metaKeywords = document.querySelector('meta[name$="keywords"]')?.content || '';
                                const metaTitle = document.querySelector('meta[name$="title"]')?.content || '';
                                const metaDescription = document.querySelector('meta[name$="description"]')?.content || '';
                                return { metaKeywords, metaTitle, metaDescription };
                            }
                        }, (results: chrome.scripting.InjectionResult<{ metaKeywords: string; metaTitle: string; metaDescription: string; }>[]) => {
                            chrome.tabs.remove(tabId);
                            if (chrome.runtime.lastError) {
                                sendResponse({ error: chrome.runtime.lastError.message });
                            } else if (results && results[0] && results[0].result) {
                                sendResponse({ data: results[0].result });
                            }
                        });
                    }
                };

                chrome.webNavigation.onCompleted.addListener(listener);
            }
        });

        // 返回 true 表示我们希望保持消息通道开放，以便异步响应可以发送回去
        return true;
    }
});
