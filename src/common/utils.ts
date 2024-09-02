interface BookmarkNode {
  id: string;
  parentId: string;
  title: string;
  url?: string;
  dateGroupModified?: number;
  dateAdded: number;
  index: number;
  children?: BookmarkNode[];
}

interface FlattenedBookmark {
  id: string;
  parentId: string;
  title: string;
  url?: string;
  dateGroupModified?: number;
  dateAdded: number;
  index: number;
  treeId: string;
  treeName: string;
  domain?: string;
  domainTitle: string;
  metaTitle: string;
  metaKeywords: string;
  metaDescription: string;
  tags: string;
  type: "folder" | "bookmark";
  childrenCount: number;
  status: number;
  dateAddedTime: string;
  dateGroupModifiedTime?: string | null;
}

const Util = {
  flattenBookmarkTree: function (bookmarkNodes: BookmarkNode[], treeId: string = "", treeName: string = ""): FlattenedBookmark[] {
    let bookmarks: FlattenedBookmark[] = [];
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
  formatBookmark: function (node: BookmarkNode, treeId: string, treeName: string): FlattenedBookmark {
    return {
      id: node.id,
      parentId: node.parentId,
      title: node.title,
      url: node.url,
      dateGroupModified: node.dateGroupModified,
      dateAdded: node.dateAdded,
      index: node.index,
      treeId: treeId,
      treeName: treeName,
      domain: node.url ? new URL(node.url).hostname : undefined,
      domainTitle: "",
      metaTitle: "",
      metaKeywords: "",
      metaDescription: "",
      tags: "",
      type: node.children ? "folder" : "bookmark",
      childrenCount: node.children ? node.children.length : 0,
      status: 0,
      dateAddedTime: new Date(node.dateAdded).toLocaleString(),
      dateGroupModifiedTime: node.dateGroupModified ? new Date(node.dateGroupModified).toLocaleString() : null
    };
  },
  buildTree: function (datas: FlattenedBookmark[]): FlattenedBookmark[] {
    const map = new Map<string, FlattenedBookmark & { children: FlattenedBookmark[] }>();
    datas.forEach(node => {
      map.set(node.id, { ...node, children: [] });
    });
    const tree: FlattenedBookmark[] = [];
    datas.forEach(node => {
      const parent = map.get(node.parentId);
      if (parent) {
        parent.children.push(map.get(node.id)!);
      } else {
        tree.push(map.get(node.id)!);
      }
    });
    return tree;
  }
}

export default Util;
