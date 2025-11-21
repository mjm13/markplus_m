import Constant from "./constant.js";

const Util = {
    flattenBookmarkTree: function (bookmarkNodes, treeId = "", treeName = "") {
        let bookmarks = [];
        for (let node of bookmarkNodes) {
            if (node.url) {
                // 对于 URL，直接使用当前的 treeId 和 treeName
                bookmarks.push(this.formatBookmark(node, treeId, treeName));
            } else if (node.children) {
                bookmarks.push(this.formatBookmark(node, treeId, treeName));
                // 只有在处理文件夹时才更新 treeId 和 treeName
                let currentTreeId = treeId ? `${treeId}/${node.id}` : node.id;
                let currentTreeName = treeName ? `${treeName}/${node.title}` : node.title;

                // 递归处理子节点
                bookmarks = bookmarks.concat(this.flattenBookmarkTree(node.children, currentTreeId, currentTreeName));
            }
        }
        return bookmarks;
    },
    formatBookmark: function (node, treeId, treeName) {
        return {
            id: node.id,
            parentId: node.parentId,
            title: node.title,//添加书签时标题
            url: node.url,//添加时url
            currentDomain: "",
            currentUrl: "",//当前url
            dateGroupModified: node.dateGroupModified,
            dateAdded: node.dateAdded,
            index: node.index,//显示位置
            treeId: treeId,//目录id结构
            treeName: treeName,//目录结构
            label: treeName + '/' + node.title,
            domain: node.url ? new URL(node.url).hostname : null,
            tags: [],
            domainTitle: "",
            metaTitle: "",
            metaKeywords: "", // 扩展后增加meta中对应属性
            metaDescription: "", // 扩展后增加meta中对应属性
            metaTags: "",//手动或自动解析关键词
            syncChrome: true,
            type: node.children ? "folder" : "bookmark",
            childrenCount: node.children ? node.children.length : 0,
            status: node.url && node.url.startsWith("http") ? 0 : -99, //0:未处理，1:采集完成，9:已总结, -1:无法访问，-2:域名发生变化,-99:不处理,-3 重复书签
            dateAddedTime: new Date(node.dateAdded).toLocaleString(),
            dateGroupModifiedTime: node.dateGroupModified ? new Date(node.dateGroupModified).toLocaleString() : null
        };
    },
    buildTree: function (datas) {
        const map = new Map();
        datas.forEach(node => {
            map.set(node.id, { ...node, children: [] });
        });
        const tree = [];
        // let treeArr =  datas.toSorted((a, b) => a.index - b.index);
        let treeArr = datas;
        treeArr.forEach(node => {
            const parent = map.get(node.parentId);
            let temp = map.get(node.id);
            if (parent) {
                // parent.children.splice(temp.index,0,temp);
                parent.children.push(temp);
            } else {
                tree.push(temp);
            }
        });
        return tree;
    },
    getRootTree: function (datas) {
        const tree = this.buildTree(datas);
        return tree.length > 0 ? tree[0].children : [];
    }, getRemoveTabKey: function (tabId) {
        return "remove_" + tabId;
    },
    getTabKey: function (tabId) {
        return "tab_" + tabId;
    },
    getLocalStorageItem: async function (key) {
        return new Promise((resolve) => {
            chrome.storage.local.get([key], function (result) {
                resolve(result[key]);
            });
        });
    },
    setLocalStorageItem: async function (key, value) {
        await chrome.storage.local.set({ [key]: value });
    },
    clearCache: async function () {
        return new Promise((resolve) => {
            chrome.storage.local.get(null, function (items) {
                let keysToRemove = [];
                for (let [key, value] of Object.entries(items)) {
                    if (!key.startsWith("sys_")) {
                        keysToRemove.push(key);
                    }
                }
                // 移除所有符合条件的键
                if (keysToRemove.length > 0) {
                    chrome.storage.local.remove(keysToRemove);
                }
                resolve();
            });
        });
    },
    /**
     * 删除指定key缓存
     * @param key
     * @returns {Promise<unknown>}
     */
    removeLocalKey: async function (key, getCallback, removeCallback) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get([key], async function (items) {
                try {
                    if (items[key]) {
                        if (typeof getCallback === 'function') {
                            await getCallback(items);
                        }
                        chrome.storage.local.remove(key, function () {
                            if (typeof removeCallback === 'function') {
                                removeCallback(items);
                            }
                            if (chrome.runtime.lastError) {
                                reject(chrome.runtime.lastError);
                            } else {
                                resolve();
                            }
                        });
                    } else {
                        resolve(); // 如果键不存在，也完成 Promise
                    }
                } catch (error) {
                    console.error('处理节点拖拽失败:', error);
                    reject(error);
                }
            });
        });
    },

    /**
     * 等待之前任务完成
     * @returns {Promise<unknown>}
     */
    awaitLoad: async function (userConfig) {
        return new Promise((resolve) => {
            chrome.storage.local.get(null, (items) => {
                let removeCount = 0;
                for (let key in items) {
                    if (key.startsWith('remove_')) {
                        removeCount++;
                    }
                }
                if (removeCount >= userConfig.crawlQueueLength) {
                    setTimeout(() => this.awaitLoad(userConfig).then(resolve), 1000);
                } else {
                    resolve(removeCount);
                }
            });
        });
    },
    hasEmptyProperty(obj) {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (obj[key] === null || obj[key] === undefined || obj[key] === "" || obj[key].length === 0) {
                    return true;
                }
            }
        }
        return false;
    }


}


export default Util
