const Util={
  flattenBookmarkTree:function (bookmarkNodes, treeId = "", treeName = "") {
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
  formatBookmark:function (node, treeId, treeName) {
    return {
      id: node.id,
      parentId: node.parentId,
      title: node.title,//添加书签时标题
      url: node.url,//添加时url
      currentUrl:"",//当前url
      dateGroupModified: node.dateGroupModified,
      dateAdded: node.dateAdded,
      index: node.index,//显示位置
      treeId: treeId,//目录id结构
      treeName: treeName,//目录结构
      domain: node.url? new URL(node.url).hostname : null,
      domainTitle: "",
      metaTitle:"",
      metaKeywords: "", // 扩展后增加meta中对应属性
      metaDescription: "", // 扩展后增加meta中对应属性
      metaTags:"",//手动或自动解析关键词
      type: node.children ? "folder" : "bookmark",
      childrenCount : node.children ? node.children.length : 0,
      status: 0, //0:未处理，1:爬取数据中,2:爬取完成，-1：无法访问，
      dateAddedTime: new Date(node.dateAdded).toLocaleString(),
      dateGroupModifiedTime: node.dateGroupModified ? new Date(node.dateGroupModified).toLocaleString() : null
    };
  },
  buildTree:function(datas){
    const map = new Map();
    datas.forEach(node => {
      map.set(node.id, { ...node, children: [] });
    });
    const tree = [];
    // let treeArr =  datas.toSorted((a, b) => a.index - b.index);
    let treeArr =  datas;
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
  getRootTree:function(datas){
    return this.buildTree(datas)[0].children;
  },
  getLocalStorage :  function(key) {
    // Immediately return a promise and start asynchronous work
    return new Promise((resolve, reject) => {
      // Asynchronously fetch all data from storage.sync.
      chrome.storage.local.get(key, (items) => {
        // Pass any observed errors down the promise chain.
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        // Pass the data retrieved from storage down the promise chain.
        resolve(items[key]);
      });
    });
  }

}





export default Util
