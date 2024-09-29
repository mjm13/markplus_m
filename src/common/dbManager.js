const DBManager = {
    db: null,
    status: "0",
    dbName: "BookmarksDB",
    dbVersion: 1,  // 每次修改数据库结构时增加这个值
    storeName: "M-bookmarksStore",

    initDatabase: function () {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onerror = event => {
                console.error("数据库打开出错", event);
                reject("数据库打开出错");
            };
            request.onsuccess = event => {
                this.db = event.target.result;
                console.log("数据库成功打开");
                resolve(this.db);
            };
            request.onupgradeneeded = event => {
                console.log("数据库升级中");
                this.db = event.target.result;
                if (!this.db.objectStoreNames.contains(this.storeName)) {
                    console.log(`创建对象存储 ${this.storeName}`);
                    const objectStore = this.db.createObjectStore(this.storeName, {keyPath: "id"});
                }
            };
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
    saveBookmarks: async function (bookmarks) {
        return this.initDatabase().then(() => {
            return new Promise((resolve, reject) => {
                console.log("开始存储书签，总数：", bookmarks.length);
                const transaction = this.db.transaction([this.storeName], "readwrite");
                const objectStore = transaction.objectStore(this.storeName);

                let count = 0;
                bookmarks.forEach(bookmark => {
                    try{
                        if(bookmark.currentUrl && !bookmark.currentDomain){
                            bookmark.currentDomain = new URL(bookmark.currentUrl).hostname;
                        }
                    }catch (e) {}
                    const request = objectStore.put(bookmark);
                    request.onsuccess = () => {
                        count++;
                        if (count % 100 === 0) {
                            console.log(`已存储 ${count} 个书签`);
                        }
                    };
                    request.onerror = (event) => {
                        console.error("存储书签时出错", event.target.error);
                    };
                });

                transaction.oncomplete = () => {
                    console.log(`所有书签已成功存储，总数：${count}`);
                    resolve();
                };

                transaction.onerror = event => {
                    console.error("事务出错", event.target.error);
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
    deleteBookmarks: function (bookmarks) {
        let _this = this;
        return this.initDatabase().then(() => {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], "readwrite");
                const objectStore = transaction.objectStore(this.storeName);

                transaction.oncomplete = () => {
                    console.log(`删除完成!`);
                    resolve();
                };

                transaction.onerror = event => {
                    console.error("删除事务出错", event.target.error);
                    reject(event);
                };
                bookmarks.forEach(bookmark => {
                    let request;
                    if (bookmark.type === "bookmark") {
                        request = objectStore.delete(bookmark.id);
                        request.onerror = () => {
                            console.log(request.error);
                            reject(request.error);
                        };
                    } else {
                        _this.queryBookmarks({
                            prop: 'parentId',
                            operator: 'eq',
                            value: bookmark.id
                        }).then((datas)=>{
                            _this.deleteBookmarks(datas);
                        });
                        objectStore.delete(bookmark.id);
                    }

                });
            });
        });
    },
    queryBookmarks: function (queryDto) {
        return this.initDatabase().then(() => {
            return new Promise((resolve, reject) => {
                if (!queryDto || !queryDto.value || !queryDto.prop || !queryDto.operator) {
                    reject("查询参数错误");
                }
                const {prop, operator, value, limit = -1} = queryDto;
                // 根据不同的匹配规则进行查询
                const transaction = this.db.transaction([this.storeName], "readonly");
                const objectStore = transaction.objectStore(this.storeName);

                const request = objectStore.openCursor();
                const results = [];
                let count = 0;
                request.onsuccess = event => {
                    const cursor = event.target.result;
                    if (limit != -1 && count >= limit) {
                        resolve(results);
                    } else if (cursor) {
                        if (operator === "like" && prop ==="all") {
                            const props = ["title","url","treeName","metaTitle","metaKeywords","metaDescription","metaTags"];
                            for (let pro of props) {
                                if (cursor.value[pro] && cursor.value[pro].indexOf(value)>-1 ) {
                                    results.push(cursor.value);
                                }
                            }
                        }else if (operator === "like") {
                            if (cursor.value[prop] && cursor.value[prop].indexOf(value)>-1 ) {
                                    results.push(cursor.value);
                            }
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
                                case 'staticUrlChange':
                                    cursor.value.domain != cursor.value.currentDomain && results.push(cursor.value);
                                    break;
                            }
                        }
                        cursor.continue();
                    } else {
                        console.log(`搜索完成，找到 ${results.length} 个结果`);
                        let datas = results.toSorted((a, b) => a.index - b.index);
                        resolve([...new Set(datas)]);
                    }
                };

                request.onerror = event => {
                    console.error("搜索书签时发生错误", event);
                    reject(event);
                };
            });
        });
    }

};


export default  DBManager;
