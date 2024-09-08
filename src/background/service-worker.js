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
            await DBManager.saveBookmarks(bookmarks)
                .then(() => {
                    console.log("书签已初始化");
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
    port.onMessage.addListener(function (msg) {
        if (msg.action === "getData") {
            // 处理获取数据的逻辑
            let transaction = db.transaction(["myStore"], "readonly");
            let objectStore = transaction.objectStore("myStore");
            let getRequest = objectStore.get(msg.id);

            getRequest.onsuccess = function () {
                port.postMessage({data: getRequest.result});
            };
        } else if (msg.action === "setData") {
            // 处理存储数据的逻辑
            let transaction = db.transaction(["myStore"], "readwrite");
            let objectStore = transaction.objectStore("myStore");
            let putRequest = objectStore.put(msg.data);

            putRequest.onsuccess = function () {
                port.postMessage({success: true});
            };
        }
    });
});
//弹出页面
let port = chrome.runtime.connect({name: "popup-background-connection"});

// 发送消息给 background 获取数据
port.postMessage({action: "getData", id: 1});
port.onMessage.addListener(function (response) {
    if (response.data) {
        console.log("Data from IndexedDB:", response.data);
    }
});

// 发送消息给 background 存储数据
port.postMessage({action: "setData", data: {id: 1, value: "example"}});


//vue中使用实例
<script>
    export default {
    data() {
    return {
    port: null,    // 保存与 background 的连接
    receivedData: null,  // 用于保存接收到的数据
};
},
    mounted() {
    // 在组件挂载时建立连接
    this.port = chrome.runtime.connect({name: "popup-background-connection"});

    // 监听来自 background 的消息
    this.port.onMessage.addListener((msg) => {
    if (msg.data) {
    console.log("Received data from background:", msg.data);
    this.receivedData = msg.data;
}
});
},
    methods: {
    // 向 background 发送消息的示例
    sendMessageToBackground() {
    this.port.postMessage({action: "getData", id: 1});
}
},
    beforeDestroy() {
    // 组件销毁时移除监听器，避免内存泄漏
    if (this.port) {
    this.port.onMessage.removeListener(this.listener);
}
}
};
</script>
