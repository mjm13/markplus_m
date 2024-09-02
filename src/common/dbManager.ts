interface Bookmark {
    id: string;
    [key: string]: any;  // 书签的其他属性
}

interface QueryDto {
    prop: string;
    operator: 'eq' | 'gt' | 'lt' | 'like';
    value: any;
    limit?: number;
}

class DBManager {
    private db: IDBDatabase | null = null;
    private readonly dbName: string = "BookmarksDB";
    private readonly dbVersion: number = 3;
    private readonly storeName: string = "M-bookmarksStore";

    public initDatabase(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error("数据库打开出错", event);
                reject("数据库打开出错");
            };

            request.onsuccess = (event) => {
                this.db = request.result;
                console.log("数据库成功打开");
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                console.log("数据库升级中");
                this.db = request.result;
                if (!this.db.objectStoreNames.contains(this.storeName)) {
                    console.log(`创建对象存储 ${this.storeName}`);
                    this.db.createObjectStore(this.storeName, { keyPath: "id" });
                }
            };
        });
    }

    public async saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
        await this.initDatabase();
        return new Promise((resolve, reject) => {
            console.log("开始存储书签，总数：", bookmarks.length);
            const transaction = this.db!.transaction([this.storeName], "readwrite");
            const objectStore = transaction.objectStore(this.storeName);
            let count = 0;

            bookmarks.forEach((bookmark) => {
                const request = objectStore.put(bookmark);

                request.onsuccess = () => {
                    count++;
                    if (count % 100 === 0) {
                        console.log(`已存储 ${count} 个书签`);
                    }
                };

                request.onerror = (event) => {
                    console.error("存储书签时出错", (event.target as IDBRequest).error);
                };
            });

            transaction.oncomplete = () => {
                console.log(`所有书签已成功存储，总数：${count}`);
                resolve();
            };

            transaction.onerror = (event) => {
                console.error("事务出错", (event.target as IDBRequest).error);
                reject(event);
            };
        });
    }

    public async deleteBookmarks(bookmarks: string[]): Promise<void> {
        await this.initDatabase();
        return new Promise((resolve, reject) => {
            console.log("开始删除书签，总数：", bookmarks.length);
            const transaction = this.db!.transaction([this.storeName], "readwrite");
            const objectStore = transaction.objectStore(this.storeName);

            bookmarks.forEach((bookmarkId) => {
                const request = objectStore.delete(bookmarkId);

                request.onerror = (event) => {
                    console.error("删除异常", (event.target as IDBRequest).error);
                };
            });

            transaction.oncomplete = () => {
                console.log("删除完成!");
                resolve();
            };

            transaction.onerror = (event) => {
                console.error("删除事务出错", (event.target as IDBRequest).error);
                reject(event);
            };
        });
    }

    public async queryBookmarks(queryDto: QueryDto): Promise<Bookmark[]> {
        await this.initDatabase();
        return new Promise((resolve, reject) => {
            if (!queryDto || !queryDto.value || !queryDto.prop || !queryDto.operator) {
                reject("查询参数错误");
                return;
            }

            const { prop, operator, value, limit = -1 } = queryDto;
            const transaction = this.db!.transaction([this.storeName], "readonly");
            const objectStore = transaction.objectStore(this.storeName);

            const request = objectStore.openCursor();
            const results: Bookmark[] = [];
            let count = 0;

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

                if (limit !== -1 && count >= limit) {
                    console.log(`搜索完成，找到 ${results.length} 个结果`);
                    resolve(results);
                } else if (cursor) {
                    const bookmarkValue = cursor.value[prop];

                    if (operator === 'like') {
                        const regex = new RegExp(value, 'i');
                        if (regex.test(bookmarkValue)) {
                            results.push(cursor.value);
                        }
                    } else {
                        switch (operator) {
                            case 'eq':
                                bookmarkValue === value && results.push(cursor.value);
                                break;
                            case 'gt':
                                bookmarkValue >= value && results.push(cursor.value);
                                break;
                            case 'lt':
                                bookmarkValue <= value && results.push(cursor.value);
                                break;
                        }
                    }

                    count++;
                    cursor.continue();
                } else {
                    console.log(`搜索完成，找到 ${results.length} 个结果`);
                    resolve(results);
                }
            };

            request.onerror = (event) => {
                console.error("搜索书签时发生错误", event);
                reject(event);
            };
        });
    }
}

export default DBManager;
