import BookmarkManager from '../common/bookmarkManager.js';
import Constant from '../common/constant.js';
import Util from "../common/utils.js";
import LLM_M from '../common/llmutil.js';
import userSetting from "../common/userSetting.js";

/**
 * 初始化indexedDB
 */
chrome.runtime.onInstalled.addListener(() => {
    chrome.bookmarks.getTree(async function (bookmarkTreeNodes) {
        const bookmarks = Util.flattenBookmarkTree(bookmarkTreeNodes);
        let dbCount = await BookmarkManager.dbCount();
        if (dbCount != bookmarks.length) {
            BookmarkManager.saveBookmarks(bookmarks)
                .catch(error => {

                });
        }
    });
});


chrome.bookmarks.onCreated.addListener( function(id, bookmark) {

    if (bookmark.url === undefined) {
        BookmarkManager.addChromeBookmark(bookmark);
    }else {
        BookmarkManager.addChromeBookmark(bookmark).then(bookmarkDb=>{
            chrome.tabs.query({ url: bookmark.url }, (tabs) => {
                if(tabs){
                    updateBookMark([bookmarkDb],tabs[0].id);
                }
            });
        });
    }

});

chrome.bookmarks.onRemoved.addListener(function(id, removeInfo) {
    BookmarkManager.deleteBookmarks([{id,type:removeInfo.node.url?'bookmark':'folder'}])
});

chrome.bookmarks.onChanged.addListener(function(id, changeInfo) {

    BookmarkManager.getById(id).then(bookmark => {
        bookmark.url = changeInfo.url;
        bookmark.title = changeInfo.title;
        bookmark.syncChrome = true;
        BookmarkManager.saveBookmarks([bookmark]);
    })
});

chrome.bookmarks.onMoved.addListener(function(id, moveInfo) {

    BookmarkManager.getById(id).then(bookmark => {
        bookmark.index = moveInfo.index;
        bookmark.parentId = moveInfo.parentId;

        BookmarkManager.addChromeBookmark(bookmark);
    })
});
/**
 * 首页
 */
chrome.action.onClicked.addListener(async (tab) => {
    // const indexUrl = `chrome-extension://${chrome.runtime.id}/index.html`; // 动态获取扩展 ID
    //
    // chrome.tabs.query({ url: indexUrl }, (tabs) => {
    //     if (tabs.length > 0) {
    //         // 如果 index.html 标签页已经打开，则切换到它
    //         chrome.tabs.update(tabs[0].id, { active: true });
    //     } else {
    //         // 如果未打开，则创建一个新的 index.html 标签页
    //         chrome.tabs.create({ url: indexUrl });
    //     }
    // });
    chrome.runtime.openOptionsPage();
});

/**
 * 监听tab打开
 */
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (details.frameId != 0) {
        return;
    }
    const url = details.url;
    const tabKey = Util.getTabKey(details.tabId);
    Util.getLocalStorageItem(tabKey).then(value => {
        if (value == undefined) {
            chrome.storage.local.set({[tabKey]: url})
        }
    })
});

/**
 * 监听tab异常
 */
chrome.webNavigation.onErrorOccurred.addListener((details) => {
    if (details.frameId != 0) {
        return;
    }
    let url = details.url;
    const tabKey = Util.getTabKey(details.tabId);
    const removeTabKey = Util.getRemoveTabKey(details.tabId);
    Util.removeLocalKey(tabKey, (items) => {
        let searchUrl = url;
        if (items[tabKey] && items[tabKey] != url) {
            searchUrl = items[tabKey];
        }

        BookmarkManager.getByUrl(searchUrl).then(datas => {
            if (Array.isArray(datas) && datas.length > 0) {
                for (let bookmark of datas) {
                    if (bookmark && bookmark.id) { // 如果是书签地址

                        bookmark.currentUrl = url;
                        try {
                            bookmark.currentDomain = new URL(url).hostname;
                        } catch (e) {
                        }
                        bookmark.status = -1;
                    }
                }
                BookmarkManager.saveBookmarks(datas);
            }

        });
    },(items) => {

        Util.removeLocalKey(removeTabKey, (items) => {
            chrome.tabs.remove(details.tabId);
        });
    });


});

/**
 * 加载完成
 *
 */
chrome.webNavigation.onCompleted.addListener((details) => {
    if (details.parentFrameId != -1) {
        return;
    }
    let url = details.url;
    const tabId = details.tabId;

    const tabKey = Util.getTabKey(details.tabId);
    const removeTabKey = Util.getRemoveTabKey(details.tabId);

    Util.removeLocalKey(tabKey, async (items) => {

        let searchUrl = url;
        if (items[tabKey] && items[tabKey] != url) {
            searchUrl = items[tabKey];
        }

        await BookmarkManager.getByUrl(searchUrl).then(async datas => {
            if (Array.isArray(datas) && datas.length > 0) {
                const bookmark = datas[0];
                if (bookmark && bookmark.id) { // 如果是书签地址

                    bookmark.currentUrl = url;
                    bookmark.currentDomain = null;
                    try {
                        bookmark.currentDomain = new URL(url).hostname;
                    } catch (e) {
                    }
                    let sameUrl = bookmark.domain == bookmark.currentDomain;
                    for (let i = 0; i < datas.length; i++) {
                        datas[i].currentUrl = bookmark.currentUrl;
                        datas[i].currentDomain = bookmark.currentDomain;
                        if (!sameUrl) {
                            datas[i].status = -2;
                        }
                    }
                    if(!sameUrl){
                        BookmarkManager.saveBookmarks(datas);
                    }else{
                        await updateBookMark(datas, tabId);
                    }
                }
            } else {

            }
        });
    },(items) => {

        Util.removeLocalKey(removeTabKey, (items) => {
            chrome.tabs.remove(details.tabId);
        });
    });
});

/**
 * 长连接监听页面指令
 */
chrome.runtime.onConnect.addListener(function (port) {
    let _this = this;
    _this.port = port;
    _this.port.onMessage.addListener(function (params) {
        if (params.action === Constant.PAGE_EVENT.QUERY_FOLDER) {
            BookmarkManager.queryBookmarks(params).then(datas => {
                _this.port.postMessage({action: Constant.PAGE_EVENT.QUERY_FOLDER, datas: Util.getRootTree(datas)});
            })
        } else if (params.action === Constant.PAGE_EVENT.STOP_CRAWL_META) {
            chrome.storage.local.set({[Constant.ENV.SYS_CRAWL_STATUS]: "0"});
        } else if (params.action === Constant.PAGE_EVENT.RELOAD_BOOKMARK) {
            BookmarkManager.clearAll().then(value => {
                chrome.bookmarks.getTree(async function (bookmarkTreeNodes) {
                    const bookmarks = Util.flattenBookmarkTree(bookmarkTreeNodes);
                    let dbCount = await BookmarkManager.dbCount();
                    if (dbCount != bookmarks.length) {
                        BookmarkManager.saveBookmarks(bookmarks)
                            .then(result => {
                                _this.port.postMessage({action: Constant.PAGE_EVENT.RELOAD_PAGE})
                            })
                            .catch(error => {

                            });
                    }
                });
            });
        } else if (params.action === Constant.PAGE_EVENT.CRAWL_META) {
            chrome.storage.local.set({[Constant.ENV.SYS_CRAWL_STATUS]: "1"});
            BookmarkManager.queryBookmarks(params).then(async datas => {
                const userConfig = await userSetting.getSysConfig();
                await Util.clearCache();
                var i = 0;
                for (const data of datas) {
                    const crawlStatus = await Util.getLocalStorageItem(Constant.ENV.SYS_CRAWL_STATUS);
                    if (crawlStatus == "0") {
                        return;
                    }
                    if (!data.url || !data.url.startsWith('http')) {
                        continue;
                    }
                    if(!userConfig.crawlStatus.includes(data.status)){
                        continue;
                    }
                    await Util.awaitLoad(userConfig);
                    if(data.status == 2){
                        LLM_M.init().then(self => self.addSummarizeQueue(data));
                    }else{
                        await chrome.tabs.create({url: data.url, active: false}, function (tab) {
                            if(tab){

                                chrome.storage.local.set({[Util.getRemoveTabKey(tab.id)]: tab.id});
                                // const tabKey = Util.getTabKey(details.tabId);

                                chrome.storage.local.set({[Util.getTabKey(tab.id)]: data.url});
                            }
                        });
                    }
                }
                chrome.storage.local.set({[Constant.ENV.SYS_CRAWL_STATUS]: "0"}).then(value => {
                    _this.port.postMessage({action: Constant.PAGE_EVENT.STOP_CRAWL_META_ACK});
                });
            })
        } else {
            BookmarkManager.queryBookmarks(params).then(datas => {
                _this.port.postMessage({action: params.action, datas: datas});
            })
        }
    });
});


//在打开的tab页中执行脚本获取元数据
async function updateBookMark(datas, tabId) {
    let bookmark = datas[0];
    if (bookmark.status != 9 ) {
        chrome.scripting.executeScript({
            target: {tabId: tabId},
            function: () => {
                let metaKeywords = document.querySelector('meta[name$="keywords"]')?.content || '';
                let metaTitle = document.querySelector('meta[name$="title"]')?.content || '';
                if (metaTitle || metaTitle == '') {
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
                const result = {metaKeywords, metaTitle, metaDescription, metaTags};

                return result;
            }
        }, async (results) => {
            if (chrome.runtime.lastError) {

            } else {
                let status = 2;
                let data = results[0].result;
                if(datas.length > 1){
                    status = -3;
                }else if(data?.metaTitle.includes('404') ||
                    data?.metaTitle.includes('链接不存在') ||
                    data?.metaTitle.includes('表单不存在') ||
                    data?.metaTitle.includes('小站不存在') ||
                    data?.metaTitle.includes('页面不存在')){
                    status = 404;
                }

                for (let i = 0; i < datas.length; i++) {
                    datas[i].metaKeywords = data.metaKeywords;
                    datas[i].metaTitle = data.metaTitle;
                    datas[i].metaDescription = data.metaDescription;
                    datas[i].metaTags = data.metaTags;
                    datas[i].status = status;
                }
                BookmarkManager.saveBookmarks(datas);
            }
            LLM_M.init().then(self => self.addSummarizeQueue(bookmark));
        });
    } else if (!bookmark.tags || bookmark.tags.length == 0) {
        LLM_M.init().then(self => self.addSummarizeQueue(bookmark));
    }
}

