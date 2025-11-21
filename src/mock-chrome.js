if (!window.chrome || !window.chrome.runtime) {
    console.log('Mock Chrome API initialized');
    window.chrome = {
        runtime: {
            connect: () => {
                const listeners = [];
                return {
                    onDisconnect: { addListener: () => { } },
                    onMessage: {
                        addListener: (callback) => {
                            listeners.push(callback);
                        }
                    },
                    postMessage: (msg) => {
                        console.log('Mock postMessage:', msg);
                        if (msg.action === 'queryBookmarks') {
                            const mockBookmarks = [
                                { id: '1', title: 'Mock Folder', type: 'folder', children: [], dateAdded: Date.now(), parentId: '0' },
                                { id: '2', title: 'Mock Bookmark', url: 'https://example.com', type: 'bookmark', dateAdded: Date.now(), parentId: '1', status: 0 }
                            ];
                            listeners.forEach(cb => cb({ action: 'queryBookmarks', datas: mockBookmarks }));
                        } else if (msg.action === 'statisticsTotal') {
                            const mockStats = [
                                { id: '1', title: 'Mock Folder', type: 'folder', children: [], dateAdded: Date.now(), parentId: '0' },
                                { id: '2', title: 'Mock Bookmark', url: 'https://example.com', type: 'bookmark', dateAdded: Date.now(), parentId: '1', status: 0 }
                            ];
                            listeners.forEach(cb => cb({ action: 'statisticsTotal', datas: mockStats }));
                        } else if (msg.action === 'queryFolder') {
                            const mockTree = [{ id: '0', title: '书签', children: [] }];
                            listeners.forEach(cb => cb({ action: 'queryFolder', datas: mockTree }));
                        }
                    }
                };
            },
            getURL: (path) => path,
            id: 'mock-id',
            lastError: null
        },
        i18n: {
            getMessage: (key) => key
        },
        storage: {
            sync: {
                get: (keys) => Promise.resolve({}),
                set: (items) => Promise.resolve()
            },
            local: {
                get: (keys, callback) => {
                    const result = {};
                    if (Array.isArray(keys)) {
                        keys.forEach(key => result[key] = null);
                    } else if (typeof keys === 'string') {
                        result[keys] = null;
                    }
                    if (callback) callback(result);
                    return Promise.resolve(result);
                },
                set: (items, callback) => {
                    if (callback) callback();
                    return Promise.resolve();
                },
                remove: (keys, callback) => {
                    if (callback) callback();
                    return Promise.resolve();
                }
            }
        }
    };
} else {
    console.log('Native Chrome API detected, skipping mock.');
}
