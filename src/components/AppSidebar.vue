<template>
  <el-scrollbar ref="dirRefContainer" style="height: 100%">
    <el-tree ref="dirRef"
             :data="treeData"
             :expand-on-click-node="false"
             default-expand-all
             node-key="id"
             :highlight-current="true"
             :draggable="false"
             :allow-drop="allowDrop"
             @node-drop="handleNodeDrop"
             @node-drag-end="handleNodeDragEnd"
             @node-contextmenu="handleRightClick"
             @node-click="handleNodeClick">
      <template #default="{ node, data }">
        <div 
          class="folder-drop-zone-wrapper"
          @dragenter="handleFolderDragEnter($event, data)"
          @dragover="handleFolderDragOver($event, data)"
          @dragleave="handleFolderDragLeave"
          @drop="handleFolderDrop($event, data)"
          :data-folder-id="data.id"
          :class="{ 'drag-over': dragOverFolder === data.id }"
        >
          <div class="bookmark-node">
            <el-icon class="folder-icon">
              <Folder/>
            </el-icon>
            <el-text class="bookmark-title">{{ data.title }}</el-text>
            <el-tag
                :round="true"
                class="child-count-tag"
                size="small"
                type="info"
            >
              {{ data.childrenCount }}
            </el-tag>
          </div>
        </div>
      </template>
    </el-tree>
    <div
        v-show="showContextMenu"
        class="context-menu"
        :style="{ left: menuLeft + 'px', top: menuTop + 'px' }"
    >
      <div class="menu-item" @click="handleRemoveBookmark">{{ t('btn.del') }}</div>
      <div class="menu-item" @click="handleEditBookmark">{{ t('btn.edit') }}</div>
    </div>
  </el-scrollbar>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import chromeService from '../common/chromeService'
import Constant from '../common/constant'

const { t } = useI18n()

const props = defineProps({
  isDragging: {
    type: Boolean,
    default: false
  },
  draggedBookmark: {
    type: Object,
    default: null
  }
})

const emit = defineEmits([
  'node-click',
  'node-drop',
  'node-drag-end',
  'folder-drop',
  'remove-bookmark',
  'edit-bookmark'
])

const dirRef = ref(null)
const treeData = ref([])
const showContextMenu = ref(false)
const menuLeft = ref(0)
const menuTop = ref(0)
const dragOverFolder = ref(null)
const rightClickNode = ref(null)

let removeListener = null

const handleRightClick = (event, data, node, component) => {
  showContextMenu.value = true
  menuLeft.value = event.clientX
  menuTop.value = event.clientY
  rightClickNode.value = data
}

const closeContextMenu = () => {
  showContextMenu.value = false
}

const handleRemoveBookmark = () => {
  if (rightClickNode.value) {
    emit('remove-bookmark', rightClickNode.value)
  }
  showContextMenu.value = false
}

const handleEditBookmark = () => {
  if (rightClickNode.value) {
    emit('edit-bookmark', rightClickNode.value)
  }
  showContextMenu.value = false
}

const handleNodeClick = (data) => {
  console.log('AppSidebar: handleNodeClick', data)
  showContextMenu.value = false
  emit('node-click', data)
}

const allowDrop = (draggingNode, dropNode, type) => {
  return dropNode.data.type === 'folder' && type !== 'inner';
}

const handleNodeDrop = (draggingNode, dropNode, dropType, ev) => {
  emit('node-drop', draggingNode, dropNode, dropType, ev)
}

const handleNodeDragEnd = (draggingNode, dropNode, dropType, ev) => {
  emit('node-drag-end', draggingNode, dropNode, dropType, ev)
}

const handleFolderDragEnter = (event, data) => {
  if (props.isDragging && props.draggedBookmark) {
    console.log('[AppSidebar] dragenter on:', data.title, 'setting dragOverFolder to:', data.id)
    dragOverFolder.value = data.id
  }
}

const handleFolderDragOver = (event, data) => {
  if (props.isDragging && props.draggedBookmark) {
    event.preventDefault()
    // console.log('[AppSidebar] dragover on folder:', data.title, 'dragOverFolder:', dragOverFolder.value)
  }
}

const handleFolderDragLeave = (event) => {
  // 不在这里清除 dragOverFolder,因为在子元素之间移动也会触发 dragleave
  // console.log('[AppSidebar] dragleave (ignored), current dragOverFolder:', dragOverFolder.value)
}

const handleFolderDrop = (event, data) => {
  console.log('[AppSidebar] drop on folder:', data.title)
  event.preventDefault()
  dragOverFolder.value = null
  emit('folder-drop', event, data)
}

// 监听全局拖拽结束事件来清除高亮
const handleGlobalDragEnd = () => {
  console.log('[AppSidebar] global dragend, clearing dragOverFolder')
  dragOverFolder.value = null
}

onMounted(() => {
  document.addEventListener('click', closeContextMenu)
  document.addEventListener('dragend', handleGlobalDragEnd)
  
  removeListener = chromeService.addListener((message) => {
    console.log('AppSidebar received message:', message);
    if (message.action === Constant.PAGE_EVENT.QUERY_FOLDER) {
      console.log('AppSidebar updating treeData:', message.datas);
      if (message.datas && message.datas.length > 0) {
        treeData.value = message.datas
      }
    } else if (message.action === Constant.PAGE_EVENT.STATISTICS_TOTAL) {
      console.log('AppSidebar received statisticsTotal:', message.datas.length);
      const { datas } = message;
      let folderData = [];
      let map = datas.reduce((acc, data) => {
        acc[data.id] = data;
        if (data.type === 'folder') {
          data.childrenCount = 0;
          folderData.push(data);
        }
        return acc;
      }, {});

      for (const data of datas) {
        if (map[data.parentId] != null) {
          map[data.parentId].childrenCount += 1;
        }
      }
      
      // Import Util if not already imported, or use a local helper if Util is not available in this scope
      // Assuming Util is imported as in App.vue
      import('../common/utils.js').then((module) => {
        const Util = module.default;
        treeData.value = Util.getRootTree(folderData);
        console.log('AppSidebar built tree from statisticsTotal:', treeData.value);
      });
    }
  })
  
  // Initial query
  chromeService.postMessage({
    action: Constant.PAGE_EVENT.QUERY_FOLDER
  })
})

// Watch dragOverFolder for debugging
watch(dragOverFolder, (newVal, oldVal) => {
  console.log('[AppSidebar] dragOverFolder changed from', oldVal, 'to', newVal)
})

onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu)
  document.removeEventListener('dragend', handleGlobalDragEnd)
  if (removeListener) {
    removeListener()
  }
})

defineExpose({
  setCurrentKey: (key) => {
    if (dirRef.value) {
      // 设置选中状态
      dirRef.value.setCurrentKey(key)
      
      // 等待 DOM 更新后滚动到可视区域
      nextTick(() => {
        // 查找对应的 DOM 元素
        const node = dirRef.value.getNode(key)
        if (node && node.$el) {
          // 滚动到元素
          node.$el.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
        } else {
          // 如果 getNode 方法不可用,尝试通过 data-folder-id 查找
          const treeContainer = dirRef.value.$el
          if (treeContainer) {
            const element = treeContainer.querySelector(`[data-folder-id="${key}"]`)
            if (element) {
              element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              })
            }
          }
        }
      })
    }
  }
})
</script>



<style scoped>
/* 文件夹拖拽区域样式 */
.folder-drop-zone-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  cursor: pointer;
  height: 100%;
}

.folder-drop-zone-wrapper:hover {
  background-color: #f5f7fa;
}

.folder-drop-zone-wrapper.drag-over {
  background-color: transparent !important;
  /* 确保拖拽状态下容器高度不变 */
  min-height: auto !important;
  padding: 0 !important;
}

.folder-drop-zone-wrapper.drag-over .bookmark-node {
  background-color: #e6f7ff !important;
  border: 1px solid #1890ff !important;
  border-radius: 4px !important;
  box-shadow: 0 0 4px rgba(24, 144, 255, 0.2);
  width: 100%;
  display: flex !important;
  align-items: center !important;
  min-height: 26px !important;
  position: relative;
  /* 保持与默认状态相同的高度,不添加额外padding */
}

.folder-drop-zone-wrapper.drag-over .bookmark-title {
  color: #1890ff !important;
  font-weight: bold;
}

.folder-drop-zone-wrapper.drag-over .folder-icon {
  color: #1890ff !important;
}

/* 精简的拖拽提示 */
.folder-drop-zone-wrapper.drag-over .bookmark-node::after {
  /* content: "📁"; */
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #1890ff;
  z-index: 10;
}

.bookmark-node {
  display: flex;
  align-items: center;
  font-size: 13px;
  width: 100%;
  line-height: 1.4;
  padding: 0;
  margin: 0;
  min-height: 28px;
  position: relative;
}

.folder-icon {
  margin-right: 6px;
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  flex-shrink: 0;
}

.bookmark-title {
  margin-right: 6px;
  display: inline-flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  line-height: 1.4;
}

.child-count-tag {
  font-size: 10px;
  height: 16px;
  line-height: 16px;
  padding: 0 4px;
}

.context-menu {
  position: fixed;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
  z-index: 9999;
}

.menu-item {
  padding: 8px 20px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
}

.menu-item:hover {
  background: #f5f7fa;
  color: #409eff;
}

/* Deep selectors for el-tree customization */
:deep(.el-tree-node__content) {
  align-items: center !important;
  padding: 6px 8px !important;
  display: flex !important;
  flex-direction: row !important;
  min-height: 28px !important;
  line-height: 1.4 !important;
  height: auto !important;
}

:deep(.el-tree-node__expand-icon) {
  margin-right: 6px !important;
  font-size: 12px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  vertical-align: baseline !important;
  line-height: 1.4 !important;
  width: 14px !important;
  height: 14px !important;
  flex-shrink: 0 !important;
  position: relative !important;
  top: 0 !important;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: transparent !important;
}

:deep(.el-tree-node.is-current > .el-tree-node__content .bookmark-node) {
  background-color: #f0f9ff !important;
  border-radius: 4px !important;
  padding: 2px 4px !important;
}

:deep(.el-tree-node.is-current > .el-tree-node__content .folder-icon) {
  color: #409eff !important;
}

:deep(.el-tree-node.is-current > .el-tree-node__content .bookmark-title) {
  color: #409eff !important;
  font-weight: bold !important;
}

:deep(.el-tree-node.is-drop-inner) {
  background-color: #f0f9ff;
  border: 2px dashed #409eff;
}

:deep(.el-tree-node.is-drop-inner > .el-tree-node__content) {
  background-color: #f0f9ff;
  color: #409eff;
}

/* 保持树形结构的层级缩进 */
:deep(.el-tree-node) {
  position: relative;
}

:deep(.el-tree-node__children) {
  padding-left: 24px !important;
  overflow: visible !important;
}

/* 多级缩进支持 */
:deep(.el-tree-node .el-tree-node__children .el-tree-node__children) {
  padding-left: 24px !important;
}

:deep(.el-tree-node .el-tree-node__children .el-tree-node__children .el-tree-node__children) {
  padding-left: 24px !important;
}

/* 确保展开图标正确显示 */
:deep(.el-tree .el-tree-node .el-tree-node__expand-icon) {
  transition: transform 0.3s ease !important;
}

:deep(.el-tree .el-tree-node.is-expanded > .el-tree-node__content > .el-tree-node__expand-icon) {
  transform: rotate(90deg) !important;
}

:deep(.el-tree .el-tree-node .el-tree-node__expand-icon.is-leaf) {
  visibility: hidden !important;
}

/* 为不同层级添加视觉指示 */
:deep(.el-tree-node__content::before) {
  content: '';
  position: absolute;
  left: -12px;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: #e4e7ed;
  opacity: 0.5;
}

:deep(.el-tree > .el-tree-node > .el-tree-node__content::before) {
  display: none;
}
</style>
