# 拖拽功能调试指南

## 调试步骤

### 1. 打开开发者工具
- 在 Chrome 扩展页面按 F12 打开开发者工具
- 切换到 Console 标签页

### 2. 检查初始化日志
启动应用后，应该看到以下日志：
```
App component mounted
读取配置完成
Edit model loaded: true/false
Initial drag setup after mount
setupAllBookmarksDrag called, editModel: true/false
```

### 3. 检查编辑模式切换
当切换编辑模式开关时，应该看到：
```
Edit model changed to: true/false
Setting up drag after edit mode change
setupAllBookmarksDrag called, editModel: true/false
```

### 4. 检查书签数据加载
当书签数据加载完成后，应该看到：
```
Setting up drag after bookmark data update (edit mode/non-edit mode)
setupAllBookmarksDrag called, editModel: true/false
Setting up drag for all bookmarks, total bookmarks: X
Found bookmark rows: X
Row 0: {bookmark: "id", type: "bookmark"}
Setting up drag for bookmark 0: id
setupDragForBookmark called: {element: ..., data: "id", editModel: true}
Setting up drag for bookmark: id title
Drag setup completed for: id
```

### 5. 检查拖拽开始
当开始拖拽书签时，应该看到：
```
Drag start triggered for: bookmarkId
handleDragStart called: {editModel: true, data: "bookmarkId", type: "bookmark"}
Starting drag for bookmark: bookmarkId title
Setting drag data: {id: "bookmarkId", type: "bookmark", ...}
Adding drag styles to row
```

### 6. 检查拖拽放置
当将书签拖拽到文件夹时，应该看到：
```
handleFolderDrop called: {folderData: "folderId", isDragging: true}
Drag data received: {"id":"bookmarkId","type":"bookmark",...}
Parsed bookmark data: {id: "bookmarkId", type: "bookmark", ...}
Target folder data: {id: "folderId", type: "folder", ...}
Moving bookmark to folder
```

## 常见问题诊断

### 问题1: 书签无法拖拽
**检查日志**:
- `setBookmarkRef called` 是否被调用？
- `setupDragForBookmark called` 是否被调用？
- `editModel` 是否为 `true`？

**可能原因**:
- 未开启编辑模式
- DOM 元素未正确绑定
- 书签类型不是 'bookmark'

### 问题2: 拖拽开始但无法放置
**检查日志**:
- `Drag start triggered` 是否出现？
- `handleFolderDrop called` 是否出现？
- `isDragging` 状态是否正确？

**可能原因**:
- 文件夹拖拽区域事件未绑定
- 拖拽数据传输失败

### 问题3: 拖拽放置失败
**检查日志**:
- `Drag data received` 是否有数据？
- `Parsed bookmark data` 是否正确？
- `Moving bookmark to folder` 是否出现？

**可能原因**:
- 拖拽数据格式错误
- 目标不是文件夹类型
- 书签移动逻辑错误

## 调试技巧

### 1. 手动触发拖拽设置
在控制台中执行：
```javascript
// 获取 Vue 实例
const app = document.querySelector('#app').__vue__;
// 手动触发拖拽设置
app.setupAllBookmarksDrag();
```

### 2. 检查 DOM 元素
```javascript
// 检查书签行元素
const rows = document.querySelectorAll('#bookmarkList .el-row');
console.log('Bookmark rows:', rows);

// 检查拖拽属性
rows.forEach((row, index) => {
  console.log(`Row ${index}:`, {
    draggable: row.draggable,
    cursor: row.style.cursor,
    hasStartHandler: !!row._dragStartHandler,
    hasEndHandler: !!row._dragEndHandler
  });
});
```

### 3. 检查文件夹拖拽区域
```javascript
// 检查文件夹拖拽区域
const folders = document.querySelectorAll('.folder-drop-zone');
console.log('Folder drop zones:', folders);
```

### 4. 模拟拖拽事件
```javascript
// 模拟拖拽开始
const bookmarkRow = document.querySelector('#bookmarkList .el-row');
if (bookmarkRow) {
  const dragEvent = new DragEvent('dragstart', {
    bubbles: true,
    cancelable: true,
    dataTransfer: new DataTransfer()
  });
  bookmarkRow.dispatchEvent(dragEvent);
}
```

## 预期行为

### 正常流程
1. 应用启动 → 初始化日志
2. 切换编辑模式 → 拖拽设置日志
3. 书签数据加载 → 拖拽绑定日志
4. 开始拖拽 → 拖拽开始日志
5. 拖拽到文件夹 → 拖拽放置日志
6. 移动完成 → 成功提示

### 异常情况
- 如果某个步骤的日志缺失，说明该步骤存在问题
- 如果日志显示 `editModel: false`，需要先开启编辑模式
- 如果 `Found bookmark rows: 0`，说明 DOM 查询有问题

通过这些日志，可以精确定位拖拽功能的问题所在。