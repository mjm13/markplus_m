const BookmarkManager = {
    db: null,
    status: "0",
    dbName: "BookmarksDB",
    dbVersion: 1,  // 每次修改数据库结构时增加这个值
    storeName: "M-bookmarksStore",

    initDatabase: function () {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onerror = event => {

                reject("数据库打开出错");
            };
            request.onsuccess = event => {
                this.db = event.target.result;
                resolve(this.db);
            };
            request.onupgradeneeded = event => {

                this.db = event.target.result;
                if (!this.db.objectStoreNames.contains(this.storeName)) {

                    const objectStore = this.db.createObjectStore(this.storeName, {keyPath: "id"});
                }
            };
        });
    },
    getById: async function (id){
        return this.initDatabase().then(() => {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], "readonly");
                const objectStore = transaction.objectStore(this.storeName);
                let countRequest = objectStore.get(id);

                countRequest.onsuccess = (event) => {
                    resolve(event.target.result);
                };

                countRequest.onerror = () => {
                    reject(countRequest.error);
                };
            });
        });
    },
    getByUrl: async function (url){
        if(url){
            return this.queryBookmarks({
                prop: 'url',
                operator: 'eq',
                value: url
            });
        }
    },
    clearAll: async function () {
        return this.initDatabase().then(() => {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], "readwrite");
                const objectStore = transaction.objectStore(this.storeName);
                const clearRequest = objectStore.clear();

                clearRequest.onsuccess = () => {
                    resolve("All records have been cleared");
                };

                clearRequest.onerror = () => {
                    reject(clearRequest.error);
                };
            });
        });
    },
    getParentSync :async function (objectStore, parentId) {
        try {
            const parent = await new Promise((resolve, reject) => {
                const request = objectStore.get(parentId);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            return parent;
        } catch (error) {

            return null; // 或者返回适当的错误处理
        }
    },
    addChromeBookmark: async function(bookmark){
        const _this = this;
        return this.initDatabase().then(() => {
            return new Promise(async (resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], "readwrite");
                const objectStore = transaction.objectStore(this.storeName);

                const bookmarkDb = {
                    id: bookmark.id,
                    parentId: bookmark.parentId,
                    title: bookmark.title,
                    url: bookmark.url,
                    currentDomain:bookmark.url ? new URL(bookmark.url).hostname : null,
                    currentUrl: bookmark.url,
                    dateAdded: bookmark.dateAdded,
                    index: bookmark.index,
                    domain: bookmark.url ? new URL(bookmark.url).hostname : null,
                    tags:[],
                    syncChrome: true,
                    type: bookmark.url ? "bookmark" : "folder",
                    status: 0,
                    dateAddedTime: new Date(bookmark.dateAdded).toLocaleString(),
                    dateGroupModifiedTime: new Date(bookmark.dateAdded).toLocaleString()
                };

                let parent =await _this.getParentSync(objectStore,bookmark.parentId);
                bookmarkDb.treeId = parent.treeId+"/"+parent.id;
                bookmarkDb.treeName = parent.treeName+"/"+parent.title;
                objectStore.put(bookmarkDb)

                transaction.oncomplete = () => {

                    resolve(bookmarkDb);
                };

                transaction.onerror = event => {

                    reject(event);
                };
            });
        });
    },
    uploadBookMarks: async function(bookmarks){
        let bookmarksDB = await this.queryBookmarks({prop: 'id',
            operator: 'gt',
            value: -1
        });
        const resultMap = new Map();
        for (const item of bookmarksDB) {
            const url = item.url;
            if (resultMap.has(url)) {
                resultMap.get(url).push(item);
            } else {
                resultMap.set(url, [item]);
            }
        }
        for (const item of bookmarks) {
            let array = resultMap.get(item.url);
            if(!array){
                continue;
            }
            let tempArr = [];
            for (let bookmark of array) {
                bookmark = {...bookmark,
                    "domainTitle":item.domainTitle,
                    "metaTitle":item.metaTitle,
                    "metaKeywords":item.metaKeywords,
                    "metaDescription":item.metaDescription,
                    "metaTags":item.metaTags,
                    "status":item.status,
                    "tags":item.tags,
                };
                tempArr.push(bookmark);
            }
            resultMap.set(item.url,tempArr);
        }
        const datas = Array.from(resultMap.values()).flatMap(list => list);
        // for (let data of datas) {
        //     if(data.status > 0 && data.type == 'bookmark'){

        //     }
        // }
        this.saveBookmarks(datas);
    },
    saveBookmarks: async function (bookmarks) {
        return this.initDatabase().then(() => {
            return new Promise((resolve, reject) => {

                const transaction = this.db.transaction([this.storeName], "readwrite");
                const objectStore = transaction.objectStore(this.storeName);

                let count = 0;
                bookmarks.forEach(bookmark => {

                    try{
                        if(bookmark.currentUrl && !bookmark.currentDomain){
                            bookmark.currentDomain = new URL(bookmark.currentUrl).hostname;
                        }
                    }catch (e) {}

                    if(!bookmark.syncChrome){
                        let modifyBookmark = {};
                        if(bookmark.move){
                            modifyBookmark = {"parentId":bookmark.parentId+"","index":bookmark.index};
                            chrome.bookmarks.move(bookmark.id,modifyBookmark);
                            bookmark.move = false;
                        }else{
                            if(bookmark.type === "folder"){
                                modifyBookmark = {"title":bookmark.title};
                            }else{
                                modifyBookmark = {"title":bookmark.title,"url":bookmark.url};
                            }
                            chrome.bookmarks.update(bookmark.id,modifyBookmark);
                        }
                        bookmark.syncChrome = true;
                    }
                    if(bookmark.tags){
                        bookmark = {...bookmark,tags:[...bookmark.tags],children:null};
                    }
                    const request = objectStore.put(bookmark);
                    // request.onsuccess = () => {
                    //     count++;
                    //     if (count % 100 === 0) {

                    //     }
                    // };
                    request.onerror = (event) => {

                    };
                });

                transaction.oncomplete = () => {

                    resolve();
                };

                transaction.onerror = event => {

                    reject(event);
                };
            });
        });
    },
    dbCount: async function() {
        return this.initDatabase().then(() => {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], "readonly");
                const objectStore = transaction.objectStore(this.storeName);
                const countRequest = objectStore.count();
                countRequest.onsuccess = () => {
                    resolve(countRequest.result);
                };
                countRequest.onerror = () => {
                    reject(countRequest.error);
                };
            });
        });
    },
    deleteBookmarks: async function (bookmarks) {
        if (!Array.isArray(bookmarks) || bookmarks.length === 0) {
            throw new Error('无效的书签数组');
        }

        try {
            await this.initDatabase();
            const results = {
                success: [],
                failed: [],
                total: 0
            };

            // 批量处理函数
            const processBatch = async (bookmarksBatch) => {
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction([this.storeName], "readwrite");
                    const objectStore = transaction.objectStore(this.storeName);
                    let completed = 0;

                    // 设置事务完成和错误处理
                    transaction.oncomplete = () => {
                        resolve();
                    };

                    transaction.onerror = (event) => {
                        reject(event.target.error);
                    };

                    // 处理每个书签
                    bookmarksBatch.forEach(async (bookmark) => {
                        try {
                            // 然后删除 IndexedDB 数据
                            const request = objectStore.delete(bookmark.id);
                            request.onsuccess = () => {
                                results.success.push(bookmark.id);
                                completed++;

                                if (completed === bookmarksBatch.length) {
                                    // 所有操作完成
                                    resolve();
                                }
                            };
                            request.onerror = (event) => {
                                results.failed.push({
                                    id: bookmark.id,
                                    error: event.target.error.message
                                });
                                completed++;

                                if (completed === bookmarksBatch.length) {
                                    resolve();
                                }
                            };

                            // 先删除 Chrome 书签
                            if (bookmark.type === "bookmark") {
                                await chrome.bookmarks.remove(bookmark.id);
                            } else {
                                await chrome.bookmarks.removeTree(bookmark.id);
                            }
                        } catch (error) {
                            results.failed.push({
                                id: bookmark.id,
                                error: error.message
                            });
                            completed++;

                            if (completed === bookmarksBatch.length) {
                                resolve();
                            }
                        }
                    });
                });
            };

            // 递归处理文件夹结构
            const processBookmarkRecursively = async (bookmark) => {
                const result = [bookmark];
                if (bookmark.type !== "bookmark") {
                    const childBookmarks = await this.queryBookmarks({
                        prop: 'parentId',
                        operator: 'eq',
                        value: bookmark.id
                    });

                    for (const child of childBookmarks) {
                        const childResults = await processBookmarkRecursively(child);
                        result.push(...childResults);
                    }
                }
                return result;
            };

            // 收集所有需要删除的书签
            const allBookmarksToDelete = [];
            for (const bookmark of bookmarks) {
                const processed = await processBookmarkRecursively(bookmark);
                allBookmarksToDelete.push(...processed);
            }

            // 去重
            const uniqueBookmarks = [...new Map(
                allBookmarksToDelete.map(item => [item.id, item])
            ).values()];

            results.total = uniqueBookmarks.length;

            // 分批处理删除操作
            const BATCH_SIZE = 50;
            for (let i = 0; i < uniqueBookmarks.length; i += BATCH_SIZE) {
                const batch = uniqueBookmarks.slice(i, i + BATCH_SIZE);
                await processBatch(batch);
            }

            // 返回删除结果
            return {
                success: results.success.length,
                failed: results.failed,
                total: results.total,
                message: `删除完成: 成功 ${results.success.length}/${results.total}`
            };

        } catch (error) {

            throw error;
        }
    },
    highlightSearch: function(data,pro,value,regex){
        let str = value.replace(regex,(match) => `<span style="color: #f56c6c">${match}</span>`);
        data[pro+"Show"] = str;
    },
    queryBookmarks: function (queryDto) {
        let _this = this;
        return this.initDatabase().then(() => {
            return new Promise((resolve, reject) => {
                const {prop, operator, value, limit = -1} = queryDto;
                // 根据不同的匹配规则进行查询
                const transaction = this.db.transaction([this.storeName], "readonly");
                const objectStore = transaction.objectStore(this.storeName);

                const request = objectStore.openCursor();
                const results = [];
                let count = 0;
                const regex = new RegExp(value, "i");

                request.onsuccess = event => {
                    const cursor = event.target.result;
                    if (limit != -1 && count >= limit) {
                        resolve(results);
                    } else if (cursor) {
                        let searchResult = cursor.value;
                        if (operator === "like" && prop ==="all") {
                            const props = ["title","url","tags","treeName","metaTitle","metaKeywords","metaDescription","metaTags"];
                            for (let pro of props) {
                                if (pro == "tags" && cursor.value[pro] && regex.test(cursor.value[pro].join(','))) {
                                    _this.highlightSearch(searchResult,pro,cursor.value[pro].join(','),regex);
                                    results.push(searchResult);
                                }else if (cursor.value[pro] && regex.test(cursor.value[pro]) ) {
                                    _this.highlightSearch(searchResult,pro,cursor.value[pro],regex);
                                    results.push(searchResult);
                                }
                            }
                        }else if (operator === "like") {
                            if (prop == "tags" && cursor.value[prop] && regex.test(cursor.value[prop].join(','))) {
                                _this.highlightSearch(searchResult,prop,cursor.value[prop].join(','),regex);
                                results.push(searchResult);
                            }else if (cursor.value[prop] && regex.test(cursor.value[prop]) ) {
                                _this.highlightSearch(searchResult,prop,cursor.value[prop],regex);
                                results.push(searchResult);
                            }
                        } else if (prop == 'status' && cursor.value.type == 'folder') {
                        } else if (prop == 'url') {
                            let dburl = cursor.value[prop]?cursor.value[prop].replace(/(http|https):\/\//g, ''):"";
                            let queryurl = value.replace(/(http|https):\/\//g, '');
                            dburl == queryurl && results.push(cursor.value);
                        } else {
                            switch (operator) {
                                case 'eq':
                                    cursor.value[prop] === value && results.push(cursor.value);
                                    break;
                                case 'gt':
                                    cursor.value[prop] >= value && results.push(cursor.value);
                                    break;
                                case 'lt':
                                    cursor.value[prop] <= value && results.push(cursor.value);
                                    break;
                                case 'in':
                                    value.includes(cursor.value[prop]) && cursor.value.type=='bookmark' && results.push(cursor.value);
                                    break;
                            }
                        }
                        cursor.continue();
                    } else {

                        let datas = [...new Set(results)];
                        if(prop == 'status' && value == -3){

                            datas = datas.toSorted((a, b) => {
                                let aurl = a.url?a.url.replace(/(http|https):\/\//g, ''):"";
                                let burl =  b.url?b.url.replace(/(http|https):\/\//g, ''):"";
                                return aurl.localeCompare(burl);
                            });
                        }else{
                            datas = datas.toSorted((a, b) => a.index - b.index);
                        }
                        resolve(datas);
                    }
                };

                request.onerror = event => {

                    reject(event);
                };
            });
        });
    }

};


export default  BookmarkManager;
