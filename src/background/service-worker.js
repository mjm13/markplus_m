import DBManager from '../common/dbManager.js';
import Constant from '../common/constant.js';
import Util from "../common/utils.js";
// TODO 爬取书签后清理local缓存

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
//打开管理页
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({url: 'index.html'});
});

//打开tab时缓存tabid与url
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (details.frameId != 0) {
        return;
    }
    const url = details.url;
    const tabKey = Util.getTabKey(details.tabId);
    chrome.storage.local.get(tabKey, (result) => {
        if (tabKey in result) {
            console.log(`Key "${key}" 已存在,值未被修改`);
        } else {
            chrome.storage.local.set({[tabKey]: url}, () => {
                console.log(`Key "${key}" 已被设置为: `, value);
            });
        }
    });
    // chrome.storage.local.set({[tabKey]: url});
});

//打开tab异常时清理缓存更新书签状态
chrome.webNavigation.onErrorOccurred.addListener((details) => {
    if (details.frameId != 0) {
        return;
    }
    let url = details.url;
    const tabKey = Util.getTabKey(details.tabId);
    console.log("打开标签异常!")
    chrome.storage.local.get(tabKey, (items) => {
        if (!items[tabKey]) {
            return;
        }
        chrome.storage.local.remove(tabKey);
        console.error("异常标签搜索书签", url)
        DBManager.getByUrl(url).then(datas => {
            if (Array.isArray(datas) && datas.length > 0) {
                const bookmark = datas[0];
                // if (bookmark && bookmark.id && bookmark.status!=2) { // 如果是书签地址
                if (bookmark && bookmark.id) { // 如果是书签地址
                    console.log("打开书签异常", bookmark)
                    bookmark.currentUrl = url;
                    bookmark.status = -1;
                    DBManager.saveBookmarks([bookmark]);
                }
            }

        });
        if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
        }
    });
    const removeTabKey = Util.getRemoveTabKey(details.tabId);
    chrome.storage.local.get(removeTabKey, (items) => {
        if(items[removeTabKey]){
            chrome.storage.local.remove(removeTabKey);
            chrome.tabs.remove(details.tabId);
        }
    });
});

// 监听网页加载完成事件
chrome.webNavigation.onCompleted.addListener((details) => {
    if (details.frameId != 0) {
        return;
    }
    let url = details.url;
    const tabId = details.tabId;
    const tabKey =  Util.getTabKey(details.tabId);
    chrome.storage.local.get(tabKey, (items) => {
        if (!items[tabKey]) {
            return;
        }
        // Pass any observed errors down the promise chain.
        if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
        }
        let searchUrl = url;
        if(items[tabKey] && items[tabKey] != url){
            console.log("原始url：",items[tabKey],"，当前url：",url)
            searchUrl = items[tabKey];
            chrome.storage.local.remove(tabKey);
        }
        console.log("搜索书签",searchUrl)
        DBManager.getByUrl(searchUrl).then(datas => {

            if(Array.isArray(datas) && datas.length>0){
                const bookmark = datas[0];
                if (bookmark && bookmark.id) { // 如果是书签地址
                    console.log("加载完成找到书签", bookmark)
                    bookmark.currentUrl =url;
                    updateBookMark(bookmark, tabId);
                }
                if (datas.length > 1) {
                    console.error("重复书签", url);
                }
            }else{
                console.log("未找到书签:",searchUrl)
                const removeTabKey = Util.getRemoveTabKey(tabId);
                chrome.storage.local.get(removeTabKey, (items) => {
                    if(items[removeTabKey]){
                        chrome.storage.local.remove(removeTabKey);
                        chrome.tabs.remove(tabId);
                    }
                });
            }

        });
    });
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
                    if (data.status != -1) {
                        continue
                    }
                    await awaitLoad();
                    console.log("获取源数据:",data.url);
                    await chrome.tabs.create({url: data.url, active: false}, function (tab) {
                        const removeTabKey = Util.getRemoveTabKey(tab.id);
                        chrome.storage.local.set({ [removeTabKey]: tab.id });
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
async function updateBookMark(bookmark, tabId) {
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
            console.error("执行脚本时出错:", chrome.runtime.lastError);
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
        const tabKey = Util.getTabKey(tabId);
        chrome.storage.local.remove(tabKey);
        const removeTabKey = Util.getRemoveTabKey(tabId);
        chrome.storage.local.get(removeTabKey, (items) => {
            if(items[removeTabKey]){
                chrome.storage.local.remove(removeTabKey);
                chrome.tabs.remove(tabId);
            }
        });
    });
}


