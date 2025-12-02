<template>
  <el-auto-resizer>
    <template #default="{ height, width }">
      <div style="height: 100%; width: 100%; border-radius: 4px; box-shadow: 0 2px 12px 0 #909399; overflow: hidden;">
        <el-tree-v2 :data="bookmarks"
                    id="bookmarkList"
                    :highlight-current="true"
                    ref="bookmarkList"
                    :show-checkbox="setting.editModel"
                    :item-size="36"
                    :height="height"
                    :width="width"
                    node-key="id">
          <template #default="{ node, data }">
            <div 
              class="bookmark-row-compact"
              @mouseover="handleMouseOver(data)"
              :class="{ 
                'dragging': isDragging && draggedBookmark?.id === data.id,
                'bookmark-draggable': setting.editModel && lastQueryParam && lastQueryParam.prop === 'parentId' && !searchQuery.value && (data.type === 'bookmark' || data.type === 'folder')
              }"
              :data-bookmark-id="data.id"
              :data-bookmark-type="data.type"
            >
              <div class="bookmark-content-col">
                <div class="bookmark-main-content">
                  <template v-if="data.type === 'folder'">
                    <el-icon class="bookmark-icon">
                      <Folder/>
                    </el-icon>
                    <el-tooltip
                        :raw-content="true"
                        placement="top"
                        effect="light"
                        trigger="click"
                    >
                      <template #content>
                        <el-descriptions
                            direction="horizontal"
                            :column="1"
                            size="small"
                            border
                        >
                          <el-descriptions-item v-if="setting.debug" label="id"><span v-html="data.id"></span></el-descriptions-item>
                          <el-descriptions-item :label="t('bookmark.treeName')"><span v-html="data.treeNameShow || data.treeName"></span></el-descriptions-item>
                          <el-descriptions-item v-if="data.title" :label="t('bookmark.title')"><span v-html="data.titleShow || data.title" class="bookmark_tips"></span></el-descriptions-item>
                          <el-descriptions-item v-if="data.dateAddedTime" :label="t('bookmark.dateAddedTime')"><span v-html="data.dateAddedTimeShow || data.dateAddedTime"></span></el-descriptions-item>
                        </el-descriptions>
                      </template>
                      <el-text class="dir-text compact-text" @dblclick="emit('locationDir', data)" v-html="data.titleShow || data.title"/>
                    </el-tooltip>
                  </template>
                  <template v-else>
                    <img :src="getFaviconUrl(data.url)" class="bookmark-favicon"/>
                    <el-tooltip
                        :raw-content="true"
                        placement="top"
                        effect="light"
                        trigger="click"
                    >
                      <template #content>
                        <el-descriptions
                            direction="horizontal"
                            :column="1"
                            size="small"
                            border
                        >
                          <el-descriptions-item v-if="setting.debug" label="id"><span v-html="data.id"></span></el-descriptions-item>
                          <el-descriptions-item v-if="setting.debug" label="status"><span v-html="data.status"></span></el-descriptions-item>
                          <el-descriptions-item :label="t('bookmark.treeName')"><span v-html="data.treeNameShow || data.treeName"></span></el-descriptions-item>
                          <el-descriptions-item v-if="data.title " :label="t('bookmark.title')"><span v-html="data.titleShow || data.title" class="bookmark_tips"></span></el-descriptions-item>
                          <el-descriptions-item v-if="data.url " :label="t('bookmark.url')"><span v-html="data.urlShow || data.url" class="bookmark_tips"></span></el-descriptions-item>
                          <el-descriptions-item v-if="data.currentUrl && data.url!=data.currentUrl" :label="t('bookmark.currentUrl')"><span v-html="data.currentUrlShow || data.currentUrl" class="bookmark_tips"></span></el-descriptions-item>
                          <el-descriptions-item v-if="data.metaTitle" :label="t('bookmark.metaTitle')"><span v-html="data.metaTitleShow || data.metaTitle" class="bookmark_tips"></span></el-descriptions-item>
                          <el-descriptions-item v-if="data.metaKeywords " :label="t('bookmark.metaKeywords')"><span v-html="data.metaKeywordsShow || data.metaKeywords" class="bookmark_tips"></span></el-descriptions-item>
                          <el-descriptions-item v-if="data.metaDescription " :label="t('bookmark.metaDescription')" ><span v-html="data.metaDescriptionShow || data.metaDescription" class="bookmark_tips"></span></el-descriptions-item>
                          <el-descriptions-item v-if="data.tags" :label="t('bookmark.tags')"><span v-html="data.tagsShow || data.tags" class="bookmark_tips"></span></el-descriptions-item>
                          <el-descriptions-item v-if="data.dateAddedTime" :label="t('bookmark.dateAddedTime')"><span v-html="data.dateAddedTimeShow || data.dateAddedTime"></span></el-descriptions-item>
                        </el-descriptions>
                      </template>
                      <el-text class="bookmark-text compact-text" truncated @dblclick="emit('openUrl', data)" v-html="showTitle(data)"/>
                    </el-tooltip>
                  </template>
                  
                  <div class="bookmark-meta-inline">
                    <el-tag v-if="showDir" type="warning" size="small" class="compact-tag">{{data.treeName}}</el-tag>
                    
                    <div v-if="setting.editModel" class="bookmark-edit-buttons">
                      <el-button circle class="iconBtn compact-btn" :title="t('btn.locate')" type="warning" @click="emit('locationDir', data)">
                        <el-icon>
                          <Location />
                        </el-icon>
                      </el-button>

                      <el-popconfirm :title="t('confirm.delete')" width="300px"
                                     @confirm="emit('removeBookmark', data)">
                        <template #reference>
                          <el-button circle class="iconBtn compact-btn" :title="t('btn.del')" type="danger">
                            <el-icon>
                              <Delete/>
                            </el-icon>
                          </el-button>
                        </template>
                      </el-popconfirm>
                      <el-button circle class="iconBtn compact-btn" :title="t('btn.edit')" type="primary" @click="emit('editBookmark', data)">
                        <el-icon>
                          <Edit/>
                        </el-icon>
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="bookmark-status-col">
                <template v-if="data.type === 'bookmark'">
                  <template v-if="data.status === 2">
                    <el-icon color="#409efc" :title="t('bookmark.status_show.2')">
                      <CircleCheck/>
                    </el-icon>
                  </template>
                  <template v-else-if="data.status === -99">
                    <el-icon :title="t('bookmark.status_show.-99')">
                      <MuteNotification/>
                    </el-icon>
                  </template>
                  <template v-else-if="data.status === 0">
                    <el-icon :title="t('bookmark.status_show.0')">
                      <Compass/>
                    </el-icon>
                  </template>
                  <template v-else-if="data.status === 9">
                    <el-icon color="#67c23a" :title="t('bookmark.status_show.9')">
                      <CollectionTag/>
                    </el-icon>
                  </template>
                  <template v-else-if="data.status === -1">
                    <el-icon color="#F56C6C" :title="t('bookmark.status_show.-1')">
                      <CircleClose/>
                    </el-icon>
                  </template>
                  <template v-else-if="data.status === -2">
                    <el-icon color="#ffc107" :title="t('bookmark.status_show.-2')">
                      <Warning/>
                    </el-icon>
                  </template>
                  <template v-else-if="data.status === -3">
                    <el-icon color="#ffc107" :title="t('bookmark.status_show.-3')">
                      <DocumentCopy/>
                    </el-icon>
                  </template>
                  <template v-else-if="data.status === 404">
                    <el-icon  :title="t('bookmark.status_show.404')">
                      <Hide />
                    </el-icon>
                  </template>
                </template>
              </div>

            </div>
          </template>

        </el-tree-v2>
      </div>
    </template>
  </el-auto-resizer>

  <el-badge :max="10000" :value="statistics.show" :title="t('statistics.show')" type="info"
            style="position: absolute;top: 95%;left: 97%;z-index: 1000">

  </el-badge>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Folder,
  Location,
  Delete,
  Edit,
  CircleCheck,
  MuteNotification,
  Compass,
  CollectionTag,
  CircleClose,
  Warning,
  DocumentCopy,
  Hide
} from '@element-plus/icons-vue'
import chromeService from '../common/chromeService'
import Constant from '../common/constant'

const { t } = useI18n()

const props = defineProps({
  setting: {
    type: Object,
    required: true
  },
  searchQuery: {
    type: Object,
    required: true
  },
  lastQueryParam: {
    type: Object,
    default: () => ({})
  },
  statistics: {
    type: Object,
    default: () => ({})
  },
  showDir: {
    type: Boolean,
    default: false
  },
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
  'update:isDragging',
  'update:draggedBookmark',
  'locationDir',
  'removeBookmark',
  'editBookmark',
  'openUrl',
  'reload'
])

const bookmarkList = ref(null)
const dragObserver = ref(null)
const bookmarks = ref([])
const dragOverFolder = ref(null)
const isReordering = ref(false)
let removeListener = null

const getFaviconUrl = (url) => {
  if (!url) return '';
  
  // 开发环境不渲染图标
  if (import.meta.env.DEV) {
    return '';
  }
  
  try {
    // 生产环境优先使用 Chrome 的 favicon API
    if (window.chrome && chrome.runtime && chrome.runtime.getURL) {
      return `chrome://favicon/${url}`;
    }
    
    // 降级方案：使用 Google 的 favicon 服务
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}`;
  } catch (e) {
    return '';
  }
}

const showTitle = (data) => {
  return data.title || data.url || '';
}

onMounted(() => {
  setTimeout(() => {
    setupAllBookmarksDrag();
  }, 1000);

  removeListener = chromeService.addListener((message) => {
    if (message.action === Constant.PAGE_EVENT.QUERY_BOOKMARKS) {
      bookmarks.value = message.datas
      
      if (props.setting.editModel) {
        setTimeout(() => {
          setupAllBookmarksDrag();
        }, 300);
      }
    }
  })

  // Initial query
  chromeService.postMessage({
    action: Constant.PAGE_EVENT.QUERY_BOOKMARKS,
    ...props.lastQueryParam
  })
})

onBeforeUnmount(() => {
  if (dragObserver.value) {
    dragObserver.value.disconnect();
    dragObserver.value = null;
  }
  if (removeListener) {
    removeListener()
  }
})

// Drag and Drop Logic
const setupDragForBookmark = (element, data) => {
  if (!element || !props.setting.editModel) {
    return;
  }
  
  // 支持书签和文件夹的拖拽
  if (data.type !== 'bookmark' && data.type !== 'folder') {
    return;
  }
  
  // 只有在查看特定文件夹时才允许拖拽调整顺序
  const isInSpecificFolder = props.lastQueryParam && 
                            props.lastQueryParam.prop === 'parentId' && 
                            !props.searchQuery.value;
  
  if (!isInSpecificFolder) {
    return;
  }
  
  // 设置拖拽属性
  element.draggable = true;
  element.style.cursor = 'move';
  element.setAttribute('data-bookmark-id', data.id);
  element.classList.add('bookmark-draggable');
  
  // 移除之前的事件监听器
  if (element._dragStartHandler) element.removeEventListener('dragstart', element._dragStartHandler);
  if (element._dragEndHandler) {
    element.removeEventListener('dragend', element._dragEndHandler);
    element.removeEventListener('dragcancel', element._dragEndHandler);
    element.removeEventListener('dragexit', element._dragEndHandler);
  }
  if (element._dragOverHandler) element.removeEventListener('dragover', element._dragOverHandler);
  if (element._dragEnterHandler) element.removeEventListener('dragenter', element._dragEnterHandler);
  if (element._dragLeaveHandler) element.removeEventListener('dragleave', element._dragLeaveHandler);
  if (element._dropHandler) element.removeEventListener('drop', element._dropHandler);
  if (element._mouseDownHandler) element.removeEventListener('mousedown', element._mouseDownHandler);
  
  // 创建事件处理器
  element._dragStartHandler = (event) => {
    event.stopPropagation();
    handleDragStart(event, data);
  };
  
  element._dragEndHandler = (event) => {
    handleDragEnd(event);
  };
  
  element._mouseDownHandler = (event) => {
    element.draggable = true;
  };
  
  // 添加事件监听器
  element.addEventListener('dragstart', element._dragStartHandler, { passive: false });
  element.addEventListener('dragend', element._dragEndHandler, { passive: false });
  element.addEventListener('mousedown', element._mouseDownHandler, { passive: false });
  element.addEventListener('dragcancel', element._dragEndHandler, { passive: false });
  element.addEventListener('dragexit', element._dragEndHandler, { passive: false });
  
  // 添加拖拽悬停效果
  element._dragOverHandler = (event) => {
    if (props.isDragging && props.draggedBookmark && props.draggedBookmark.id !== data.id) {
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = 'move';
      element.classList.add('bookmark-drag-over');
    }
  };
  
  element._dragEnterHandler = (event) => {
    if (props.isDragging && props.draggedBookmark && props.draggedBookmark.id !== data.id) {
      event.preventDefault();
      element.classList.add('bookmark-drag-over');
    }
  };
  
  element._dragLeaveHandler = (event) => {
    if (!element.contains(event.relatedTarget)) {
      element.classList.remove('bookmark-drag-over');
    }
  };
  
  element._dropHandler = (event) => {
    event.preventDefault();
    element.classList.remove('bookmark-drag-over');
    
    if (props.isDragging && props.draggedBookmark && props.draggedBookmark.id !== data.id) {
      handleBookmarkDrop(event, data);
    }
  };
  
  element.addEventListener('dragover', element._dragOverHandler, { passive: false });
  element.addEventListener('dragenter', element._dragEnterHandler, { passive: false });
  element.addEventListener('dragleave', element._dragLeaveHandler, { passive: false });
  element.addEventListener('drop', element._dropHandler, { passive: false });
}

const handleDragStart = (event, data) => {
  if (!props.setting.editModel || (data.type !== 'bookmark' && data.type !== 'folder')) {
    event.preventDefault();
    return false;
  }
  
  document.body.classList.add('dragging-active');
  
  emit('update:isDragging', true);
  emit('update:draggedBookmark', data);
  
  const dragData = {
    id: data.id,
    type: data.type,
    title: data.title,
    url: data.url,
    parentId: data.parentId
  };
  
  try {
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    event.dataTransfer.effectAllowed = 'move';
  } catch (error) {
    console.error('设置拖拽图像失败:', error);
  }
  
  const bookmarkRow = event.target.closest('.el-row') || event.currentTarget;
  if (bookmarkRow) {
    bookmarkRow.classList.add('dragging');
    bookmarkRow.style.opacity = '0.5';
    bookmarkRow.style.transform = 'rotate(2deg)';
  }
  
  // 创建拖拽图像
  const dragImage = document.createElement('div');
  const icon = data.type === 'folder' ? '📁' : '📖';
  dragImage.textContent = `${icon} ${data.title}`;
  dragImage.style.position = 'absolute';
  dragImage.style.top = '-1000px';
  dragImage.style.padding = '4px 8px';
  dragImage.style.backgroundColor = '#409eff';
  dragImage.style.color = 'white';
  dragImage.style.borderRadius = '4px';
  dragImage.style.fontSize = '12px';
  document.body.appendChild(dragImage);
  
  try {
    event.dataTransfer.setDragImage(dragImage, 0, 0);
  } catch (error) {
    console.error('解析拖拽数据失败:', error);
  }
  
  setTimeout(() => {
    if (document.body.contains(dragImage)) {
      document.body.removeChild(dragImage);
    }
  }, 0);
  
  return true;
}

const handleDragEnd = (event) => {
  emit('update:isDragging', false);
  emit('update:draggedBookmark', null);
  dragOverFolder.value = null;
  isReordering.value = false;
  
  document.body.classList.remove('dragging-active');
  
  // 恢复样式
  const allRows = document.querySelectorAll('#bookmarkList .bookmark-row-compact, #bookmarkList [data-bookmark-type="bookmark"], #bookmarkList [data-bookmark-type="folder"]');
  allRows.forEach(row => {
    row.style.opacity = '';
    row.style.transform = '';
    row.classList.remove('dragging');
    row.style.removeProperty('opacity');
    row.style.removeProperty('transform');
  });
  
  const allBookmarkRows = document.querySelectorAll('.bookmark-drag-over');
  allBookmarkRows.forEach(row => {
    row.classList.remove('bookmark-drag-over');
  });
}

const handleBookmarkDrop = (event, targetItem) => {
  const itemType = props.draggedBookmark.type === 'folder' ? '文件夹' : '书签';
  console.log(`${itemType}拖拽到${itemType}:`, props.draggedBookmark.title, '->', targetItem.title);
  
  if (!props.isDragging || !props.draggedBookmark || props.draggedBookmark.id === targetItem.id) {
    return;
  }
  
  if (isReordering.value) {
    return;
  }
  
  if (props.draggedBookmark.parentId !== targetItem.parentId) {
    ElMessage({
      message: t('tips.sameFolder') || '只能在同一文件夹内调整顺序',
      type: 'warning',
    });
    return;
  }
  
  isReordering.value = true;
  reorderItems(props.draggedBookmark, targetItem);
}

const reorderItems = (draggedItem, targetItem) => {
  const itemType = draggedItem.type === 'folder' ? '文件夹' : '书签';
  
  const siblingsAll = bookmarks.value
    .filter(b => b.parentId === draggedItem.parentId)
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  
  const draggedPosAll = siblingsAll.findIndex(b => b.id === draggedItem.id);
  const targetPosAll = siblingsAll.findIndex(b => b.id === targetItem.id);
  
  if (draggedPosAll === -1 || targetPosAll === -1) {
    console.error(`找不到${itemType}位置`);
    isReordering.value = false;
    return;
  }
  
  if (Math.abs(draggedPosAll - targetPosAll) <= 1 && draggedPosAll < targetPosAll) {
    ElMessage({
      message: t('tips.samePosition') || '已在相同位置',
      type: 'info',
    });
    isReordering.value = false;
    return;
  }
  
  const newOrderAll = [...siblingsAll];
  const [draggedData] = newOrderAll.splice(draggedPosAll, 1);
  let insertPosAll = targetPosAll;
  if (draggedPosAll < targetPosAll) {
    insertPosAll = targetPosAll - 1;
  }
  newOrderAll.splice(insertPosAll, 0, draggedData);
  
  const updatedItems = newOrderAll.map((item, index) => ({
    ...item,
    index,
    syncChrome: false,
    move: true
  }));
  
  import('../common/bookmarkManager.js').then((module) => {
    const BookmarkManager = module.default;
    BookmarkManager.saveBookmarks(updatedItems).then(() => {
      ElMessage({
        message: t('tips.reorderSuccess') || '调整顺序成功',
        type: 'success',
      });
      isReordering.value = false;
      setTimeout(() => {
        emit('reload');
      }, 500);
    }).catch(error => {
      console.error(`调整${itemType}顺序失败:`, error);
      ElMessage({
        message: t('tips.reorderFailed') || '调整顺序失败',
        type: 'error',
      });
      isReordering.value = false;
    });
  });
}


const handleMouseOver = (data) => {
  // console.log('Mouse over:', data);
}

const setupVisibleBookmarksDrag = () => {
  if (!props.setting.editModel) {
    return;
  }
  
  const treeContainer = document.querySelector('#bookmarkList');
  if (!treeContainer) {
    return;
  }
  
  const isInSpecificFolder = props.lastQueryParam && 
                            props.lastQueryParam.prop === 'parentId' && 
                            !props.searchQuery.value;
  
  const bookmarkRows = treeContainer.querySelectorAll('[data-bookmark-type="bookmark"], [data-bookmark-type="folder"]');
  
  bookmarkRows.forEach((row) => {
    if (!isInSpecificFolder) {
      if (row.hasAttribute('data-drag-setup')) {
        row.removeAttribute('data-drag-setup');
        row.draggable = false;
        row.style.cursor = '';
        row.classList.remove('bookmark-draggable');
      }
      return;
    }
    
    if (row.hasAttribute('data-drag-setup')) {
      return;
    }
    
    const itemId = row.getAttribute('data-bookmark-id');
    const item = bookmarks.value.find(b => b.id === itemId);
    
    if (item && (item.type === 'bookmark' || item.type === 'folder')) {
      setupDragForBookmark(row, item);
      row.setAttribute('data-drag-setup', 'true');
    }
  });
}

const setupAllBookmarksDrag = () => {
  if (!props.setting.editModel) {
    return;
  }
  
  const isInSpecificFolder = props.lastQueryParam && 
                            props.lastQueryParam.prop === 'parentId' && 
                            !props.searchQuery.value;
  
  if (!isInSpecificFolder) {
    return;
  }
  
  const setupDragWithObserver = () => {
    const treeContainer = document.querySelector('#bookmarkList');
    if (!treeContainer) {
      setTimeout(setupDragWithObserver, 100);
      return;
    }
    
    setupVisibleBookmarksDrag();
    
    if (dragObserver.value) {
      dragObserver.value.disconnect();
    }
    
    dragObserver.value = new MutationObserver((mutations) => {
      let hasNewBookmarkRows = false;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const newItemRows = node.querySelectorAll ? 
              node.querySelectorAll('[data-bookmark-type="bookmark"], [data-bookmark-type="folder"]') : [];
            if (newItemRows.length > 0 || 
                (node.getAttribute && (node.getAttribute('data-bookmark-type') === 'bookmark' || 
                 node.getAttribute('data-bookmark-type') === 'folder'))) {
              hasNewBookmarkRows = true;
            }
          }
        });
      });
      
      if (hasNewBookmarkRows) {
        setTimeout(() => setupVisibleBookmarksDrag(), 50);
      }
    });
    
    dragObserver.value.observe(treeContainer, {
      childList: true,
      subtree: true
    });
  };
  
  setTimeout(setupDragWithObserver, 200);
}

// Watchers
watch(() => props.setting.editModel, (val) => {
  if (val) {
    setTimeout(() => {
      setupAllBookmarksDrag();
    }, 200);
  } else {
    // Cleanup logic if needed
  }
})

watch(bookmarks, (val) => {
  if (props.setting.editModel) {
    setTimeout(() => {
      setupAllBookmarksDrag();
    }, 300);
  }
}, { deep: true })

// Expose methods for parent
defineExpose({
  getCheckedNodes: () => {
    return bookmarkList.value ? bookmarkList.value.getCheckedNodes() : []
  },
  setCheckedKeys: (keys) => {
    if (bookmarkList.value) {
      bookmarkList.value.setCheckedKeys(keys)
    }
  }
})
</script>

<style scoped>
.bookmark-row-compact {
  width: 100% !important;
  min-height: 32px !important;
  padding: 4px 8px 4px 8px !important;
  align-items: center !important;
  font-size: 13px !important;
  line-height: 1.2 !important;
  display: flex !important;
  flex-wrap: nowrap !important;
  justify-content: space-between !important;
  gap: 8px !important;
}

.bookmark-row-compact:hover {
  background-color: #f5f7fa !important;
  border-radius: 4px;
}

.bookmark-content-col {
  display: flex !important;
  align-items: center !important;
  padding: 0 !important;
  flex: 1 !important;
  min-width: 0 !important;
  overflow: hidden !important;
}

.bookmark-main-content {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
  min-width: 0;
  overflow: visible;
  position: relative;
  padding-right: 50px;
}

.bookmark-icon {
  font-size: 14px !important;
  color: #666;
  flex-shrink: 0;
}

.bookmark-favicon {
  height: 14px !important;
  width: 14px !important;
  flex-shrink: 0;
}

.compact-text {
  font-size: 13px !important;
  line-height: 1.3 !important;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-meta-inline {
  position: absolute;
  right: 50px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  min-width: fit-content;
  overflow: visible;
  padding: 2px 4px;
  white-space: nowrap;
  justify-content: flex-end;
  opacity: 0;
  transition: opacity 0.2s ease;
  background: #ffffff;
  pointer-events: none;
}

.bookmark-row-compact:hover .bookmark-meta-inline {
  opacity: 1;
  pointer-events: auto;
}

.bookmark-edit-buttons {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  pointer-events: none;
  min-width: 60px; /* 确保按钮容器始终占据空间 */
}

.bookmark-row-compact:hover .bookmark-edit-buttons {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.compact-tag {
  font-size: 10px !important;
  height: 16px !important;
  line-height: 16px !important;
  padding: 0 4px !important;
}

.compact-btn {
  --el-button-size: 18px !important;
  padding: 2px !important;
  margin: 0 2px !important;
  min-width: 18px !important;
  min-height: 18px !important;
  border-radius: 50% !important;
  flex-shrink: 0 !important;
}

.iconBtn {
  --el-button-size: 20px !important;
  padding: 3px !important;
  margin: 0 2px !important;
  min-width: 20px !important;
  min-height: 20px !important;
  border-radius: 50% !important;
  flex-shrink: 0 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.bookmark-status-col {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  flex: 0 0 40px !important;
  width: 40px !important;
  min-width: 40px !important;
  height: 32px !important;
  padding: 0 4px !important;
  margin-left: auto !important;
}

.bookmark_tips {
  min-width: 200px;
  max-width: 600px;
  display: block;
}

.dir-text, .bookmark-text {
  display: inline-block;
  color: initial;
  text-decoration: none;
  width: 100%;
}

.bookmark-text:hover {
  color: #409EFF;
  text-decoration: underline;
}

.dragging {
  opacity: 0.5 !important;
  transform: rotate(2deg) !important;
  transition: all 0.2s ease;
}

.bookmark-draggable {
  cursor: move;
  transition: all 0.2s ease;
  user-select: none;
}

.bookmark-draggable:hover {
  background-color: #f5f7fa;
  border-radius: 4px;
}

.bookmark-drag-over {
  position: relative;
}

.bookmark-drag-over::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #409eff;
  z-index: 10;
}

/* 拖拽时禁用全局文本选择 */
:deep(body.dragging-active) {
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
}

.bookmark-draggable * {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* 紧凑的图标样式 */
.bookmark-row-compact .el-icon {
  margin-right: 8px !important;
  font-size: 14px !important;
  flex-shrink: 0;
}

/* 状态图标样式优化 */
.bookmark-status-col .el-icon {
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 16px !important;
  line-height: 1 !important;
  width: 20px !important;
  height: 20px !important;
  flex-shrink: 0 !important;
}

.iconBtn .el-icon {
  font-size: 12px !important;
  margin: 0 !important;
}

/* 紧凑的标签样式 */
.bookmark-row-compact .el-tag {
  font-size: 10px !important;
  height: 18px !important;
  line-height: 18px !important;
  padding: 0 4px !important;
  margin-left: 6px !important;
}

/* 紧凑的按钮样式 */
.bookmark-row-compact .iconBtn {
  --el-button-size: 16px !important;
  padding: 1px !important;
  margin-left: 2px !important;
}

/* 确保 bookmark-meta-inline 内的按钮完整显示 */
.bookmark-meta-inline .el-button {
  min-width: 18px !important;
  min-height: 18px !important;
  padding: 2px !important;
  flex-shrink: 0 !important;
  overflow: visible !important;
}

/* 移除不必要的换行 */
.bookmark-row-compact br {
  display: none;
}

.bookmark-row-compact .el-col {
  display: flex !important;
  align-items: center !important;
  min-height: 24px !important;
}

/* 紧凑的文本样式 */
.bookmark-row-compact .bookmark-text,
.bookmark-row-compact .dir-text {
  font-size: 13px !important;
  line-height: 1.3 !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 800px;
}

.dir-text {
  cursor: pointer;
}
</style>
