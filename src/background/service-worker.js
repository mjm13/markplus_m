import DBManager from '../common/dbManager.js';
import Constant from '../common/constant.js';
import Util from "../common/utils.js";
//初始化indexedDB
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

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    const url = details.url;
    const tabId = details.tabId +" " ;
    if (url && url != 'about:blank') {
        chrome.storage.local.set({ [tabId]: url }, function() {
            if (chrome.runtime.lastError) {
                console.error('Error storing data:', chrome.runtime.lastError);
            } else {
                console.log('Data stored successfully.');
            }
        });
    }
});

// 监听网页加载完成事件
chrome.webNavigation.onCompleted.addListener((details) => {
    let url = details.url;
    const tabId = details.tabId;
    const key = details.tabId + " ";

    if (url != 'about:blank') {
        chrome.storage.local.get(key, (items) => {
            // Pass any observed errors down the promise chain.
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            let searchUrl = url;
            if(items[key] && items[key] != url){
                console.log("原始url与打开url不一致",items[key],url)
                searchUrl = items[key];
                chrome.storage.local.remove(key);
            }
            console.log("搜索书签",searchUrl)
            DBManager.getByUrl(searchUrl).then(datas => {
                if(Array.isArray(datas)){
                    const bookmark = datas[0];
                    if (bookmark && bookmark.id && bookmark.status!=2) { // 如果是书签地址
                        console.log("getByUrl找到书签", bookmark)
                        bookmark.currentUrl =url;
                        updateBookMark(bookmark, tabId);
                    }
                }

            });
        });
    }
});

//todo主动打开url并触发更新书签
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

//在打开的tab页中执行脚本获取元数据
function updateBookMark(bookmark,tabId){
    chrome.scripting.executeScript({
        target: {tabId: tabId},
        function: () => {
            let metaKeywords = document.querySelector('meta[name$="keywords"]')?.content || '';
            let metaTitle = document.querySelector('meta[name$="title"]')?.content || '';
            if(metaTitle){
                metaTitle = document.querySelector('title')?.content || '';
            }
            let metaDescription = document.querySelector('meta[name$="description"]')?.content || '';
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
            bookmark.status = 2;
            DBManager.saveBookmarks([bookmark]);
        }
    });
}

