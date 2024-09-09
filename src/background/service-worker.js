import DBManager from '../common/dbManager.js';
import Constant from '../common/constant.js';
import Util from "../common/utils.js";

chrome.runtime.onInstalled.addListener(() => {
    console.log("Bookmark Extender 插件已安装");
    chrome.bookmarks.getTree(async function (bookmarkTreeNodes) {
        console.log("开始初始化书签");
        const bookmarks = Util.flattenBookmarkTree(bookmarkTreeNodes);
        console.log(bookmarks.length)
        let dbCount = await DBManager.dbCount();
        if (dbCount == bookmarks.length) {
            console.log("书签已初始化");
        } else {
            DBManager.saveBookmarks(bookmarks)
                .then(() => {
                    console.log("书签保存成功");
                })
                .catch(error => {
                    console.error("初始化或验证书签时出错:", error);
                });
        }
    });
});

chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({url: 'index.html'});
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchUrl') {
        chrome.tabs.create({url: request.url, active: false}, (tab) => {
            const tabId = tab.id;

            const listener = (details) => {
                if (details.tabId === tabId && details.frameId === 0) {
                    chrome.webNavigation.onCompleted.removeListener(listener);

                    chrome.scripting.executeScript({
                        target: {tabId: tabId},
                        function: () => {
                            const metaKeywords = document.querySelector('meta[name$="keywords"]')?.content || '';
                            const metaTitle = document.querySelector('meta[name$="title"]')?.content || '';
                            const metaDescription = document.querySelector('meta[name$="description"]')?.content || '';
                            return {metaKeywords, metaTitle, metaDescription};
                        }
                    }, (results) => {
                        chrome.tabs.remove(tabId);
                        if (chrome.runtime.lastError) {
                            sendResponse({error: chrome.runtime.lastError.message});
                        } else {
                            sendResponse({data: results[0].result});
                        }
                    });
                }
            };

            chrome.webNavigation.onCompleted.addListener(listener);
        });
        return true;  // 保持消息通道开放
    }
});


//长连接模式
chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (params) {
        if (params.action === Constant.QUERY_CATALOG) {
            DBManager.queryBookmarks(params).then(datas => {
                port.postMessage({action: Constant.QUERY_CATALOG, datas: Util.getRootTree(datas)});
            })
        }else if(params.action === Constant.QUERY_BOOKMARKS){
            DBManager.queryBookmarks(params).then(datas => {
                port.postMessage({action: Constant.QUERY_BOOKMARKS, datas: datas});
            })
        }
    });
});


// 监听网页加载完成事件
chrome.webNavigation.onCompleted.addListener((details) => {
    const url = details.url;
    const tabId = details.tabId;
    console.log("url:",url);
    // 查询是否为书签地址
    DBManager.queryBookmarks({ prop: 'url',
        operator: 'eq',
        value: url
      }).then(bookmarks => {
        if (bookmarks.length > 0) { // 如果是书签地址
            updateBookMark(bookmarks[0],tabId);
        }
    });
});
//在打开的tab页中执行脚本获取元数据
function updateBookMark(bookmark,tabId){
    chrome.scripting.executeScript({
        target: {tabId: tabId},
        function: () => {
            const metaKeywords = document.querySelector('meta[name$="keywords"]')?.content || '';
            const metaTitle = document.querySelector('meta[name$="title"]')?.content || '';
            const metaDescription = document.querySelector('meta[name$="description"]')?.content || '';
            return {metaKeywords, metaTitle, metaDescription};
        }
    }, (results) => {
        if (chrome.runtime.lastError) {
            console.error("执行脚本时出错:", chrome.runtime.lastError.message);
        } else {
            let data = results[0].result;
            console.log("获取的元数据:", results);
            bookmark.metaKeywords = data.metaKeywords;
            bookmark.metaTitle = data.metaTitle;
            bookmark.metaDescription = data.metaDescription;
            DBManager.saveBookmarks([bookmark]);
        }
    });
}

