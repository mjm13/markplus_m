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
    if (url && url != 'about:blank' && url != 'about:srcdoc') {
        chrome.storage.local.get(tabId, (items) => {
            if(!items.key){
                chrome.storage.local.set({ [tabId]: url });
            }
        });
    }
});

chrome.webNavigation.onErrorOccurred.addListener((details) => {
    let url = details.url;
    const key = details.tabId + " ";
    console.log("打开标签异常!")
    chrome.storage.local.get(key, (items) => {
        // Pass any observed errors down the promise chain.
        if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
        }
        chrome.storage.local.remove(key);
        console.log("异常标签搜索书签", url)
        DBManager.getByUrl(url).then(datas => {
            if (Array.isArray(datas) && datas.length > 0) {
                const bookmark = datas[0];
                // if (bookmark && bookmark.id && bookmark.status!=2) { // 如果是书签地址
                if (bookmark && bookmark.id) { // 如果是书签地址
                    console.log("getByUrl找到书签", bookmark)
                    bookmark.currentUrl = url;
                    bookmark.status = -1;
                    DBManager.saveBookmarks([bookmark]);
                }
            }

        });
    });
    const removeTabId = "remove_"+details.tabId;
    chrome.storage.local.get(removeTabId, (items) => {
        if(items[removeTabId]){
            chrome.storage.local.remove(removeTabId);
            chrome.tabs.remove(items[removeTabId]);
        }
    });
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
                console.log("原始url：",items[key],"，当前url：",url)
                searchUrl = items[key];
                chrome.storage.local.remove(key);
            }
            console.log("搜索书签",searchUrl)
            DBManager.getByUrl(searchUrl).then(datas => {
                if(Array.isArray(datas) && datas.length>0){
                    const bookmark = datas[0];
                    // if (bookmark && bookmark.id && bookmark.status!=2) { // 如果是书签地址
                    if (bookmark && bookmark.id) { // 如果是书签地址
                        console.log("getByUrl找到书签", bookmark)
                        bookmark.currentUrl =url;
                        updateBookMark(bookmark, tabId);
                    }
                }else{
                    console.log("未找到书签:",searchUrl)
                    const removeTabId = "remove_"+details.tabId;
                    chrome.storage.local.get(removeTabId, (items) => {
                        if(items[removeTabId]){
                            chrome.storage.local.remove(removeTabId);
                            chrome.tabs.remove(items[removeTabId]);
                        }
                    });
                }

            });
        });
    }
});

//长连接模式
chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (params) {
        if (params.action === Constant.QUERY_CATALOG) {
            DBManager.queryBookmarks(params).then(datas => {
                port.postMessage({action: Constant.QUERY_CATALOG, datas: Util.getRootTree(datas)});
            })
        }else if(params.action === Constant.CRAWL_META){
            DBManager.queryBookmarks(params).then(async datas => {
                await chrome.storage.local.clear();

                for (const data of datas) {
                    await awaitLoad();
                    console.log("获取源数据:",data.url);
                    await chrome.tabs.create({url: data.url, active: false}, function (tab) {
                        const removeTabId = "remove_" + tab.id;
                        chrome.storage.local.set({ [removeTabId]: tab.id });
                    });
                }
            })
        } else{
            DBManager.queryBookmarks(params).then(datas => {
                port.postMessage({action: params.action, datas: datas});
            })
        }
    });
});

async function awaitLoad() {
    return new Promise((resolve) => {
        chrome.storage.local.get(null, (items) => {
            let removeCount = 0;
            for (let key in items) {
                if (key.startsWith('remove_')) {
                    removeCount++;
                }
            }
            if (removeCount > 5) {
                setTimeout(() => awaitLoad().then(resolve), 3000);
            } else {
                resolve(removeCount);
            }
        });
    });
}

//在打开的tab页中执行脚本获取元数据
function updateBookMark(bookmark,tabId){
    chrome.scripting.executeScript({
        target: {tabId: tabId},
        function: () => {
            let metaKeywords = document.querySelector('meta[name$="keywords"]')?.content || '';
            let metaTitle = document.querySelector('meta[name$="title"]')?.content || '';
            if(metaTitle || metaTitle==''){
                metaTitle = document.querySelector('title')?.text || '';
            }
            let metaDescription = document.querySelector('meta[name$="description"]')?.content || '';
            const metaTagsEle = document.querySelectorAll('meta[property$="tag"]');
            let metaTags = '';
            metaTagsEle.forEach((metaTag, index) => {
                const content = metaTag.getAttribute('content');
                if (content) {
                    metaTags += content;
                    if (index < metaTagsEle.length - 1) {
                        metaTags += ',';
                    }
                }
            });
            const result = {metaKeywords, metaTitle, metaDescription,metaTags};
            console.log("result:",result)
            return result;
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
            bookmark.metaTags = data.metaTags;
            bookmark.status = 2;
            DBManager.saveBookmarks([bookmark]);
        }
        const removeTabId = "remove_"+tabId;
        chrome.storage.local.get(removeTabId, (items) => {
            if(items[removeTabId]){
                chrome.storage.local.remove(removeTabId);
                chrome.tabs.remove(items[removeTabId]);
            }
        });
    });
}

