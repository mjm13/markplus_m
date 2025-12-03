<template>
  <div class="bookmark-mgr-container">
    <el-container direction="vertical" style="height: 100vh">
      <AppHeader
        :setting="setting"
        :search-query="searchQuery"
        :bookmark-status="bookmarkStatus"
        :statistics="statistics"
        @search-bookmarks="searchBookmarks"
        @search-statistics-bookmarks="searchStatisticsBookmarks"
        @update:setting="(val) => $emit('update:setting', val)"
        @update:search-query="(val) => Object.assign(searchQuery, val)"
        @crawl-meta="crawlMeta"
        @stop-crawl-meta="stopCrawlMeta"
        @show-user-config="setting.showUserConfig = true"
        @show-bookmark-status="showBookmarkStatus"
        @remove-all-check="removeAllCheck"
        @download-bookmarks="downLoadBookmarks"
        @upload-bookmarks="handleFileUpload"
        @reload-bookmark="reloadBookMark"
        @handle-check-all="handleCheckAll"
        @handle-edit-model-change="handleEditModelChange"
        @switch-view="$emit('switch-view')"
      />
      <el-container direction="horizontal" style="flex: 1; overflow: hidden; display: flex; flex-direction: row !important; direction: ltr; justify-content: flex-start;">
        <el-aside :style="{ width: '300px', borderRight:'3px solid var(--el-border-color)', height: '100%' }">
          <AppSidebar
            ref="sidebarRef"
            :is-dragging="isDragging"
            :dragged-bookmark="draggedBookmark"
            :tree-data="treeData"
            @node-click="queryByDir"
            @node-drop="handleNodeDrop"
            @node-drag-end="moveBookMarkDir"
            @folder-drop="handleFolderDrop"
            @remove-bookmark="removeBookmark"
            @edit-bookmark="editBookmark"
          />
        </el-aside>
        <el-main style="padding-top: 10px; padding-bottom: 10px; overflow: hidden;">
          <BookmarkList
            ref="bookmarkListRef"
            :setting="setting"
            :search-query="searchQuery"
            :last-query-param="lastQueryParam"
            :statistics="statistics"
            :show-dir="showDir"
            v-model:is-dragging="isDragging"
            v-model:dragged-bookmark="draggedBookmark"
            @location-dir="locationDir"
            @remove-bookmark="removeBookmark"
            @edit-bookmark="editBookmark"
            @open-url="openUrl"
            @reload="reloadBookmarkPage"
          />
        </el-main>
      </el-container>
    </el-container>

    <BookmarkDialog
      v-model="showBookmarkDailog"
      :bookmark="bookmark"
      :bookmark-status="bookmarkStatus"
      :setting="setting"
      @save-bookmark="saveBookmark"
      @close-bookmark-dialog="closeBookmarkDialog"
    />

    <StatusDialog
      v-model="showBookmarkStatusDailog"
      :change-bookmark-status="changeBookmarkStatus"
      :tree-data="treeData"
      :bookmark-status="bookmarkStatus"
      :last-query-param="lastQueryParam"
      @save-bookmark-status="saveBookmarkStatus"
      @sync-url="syncUrl"
    />

    <UserConfigDrawer
      v-model="setting.showUserConfig"
      :user-setting="userSetting"
      :bookmark-status="bookmarkStatus"
      :providers="providers"
      :prompt-debug-input="promptDebugInput"
      :prompt-debug-out-put="promptDebugOutPut"
      :prompt-debug="promptDebug"
      @save-user-setting="saveUserSetting"
      @prompt-debug-run="promptDebugRun"
      @update:prompt-debug-input="(val) => promptDebugInput = val"
      @update:prompt-debug-out-put="(val) => promptDebugOutPut = val"
    />
  </div>
</template>

<script>
import Constant from '../common/constant.js';
import {
  ElContainer,
  ElAside,
  ElMain,
  ElMessage
} from 'element-plus';
import BookmarkManager from "../common/bookmarkManager.js";
import LLM_M from '../common/llmutil.js';
import { useI18n } from 'vue-i18n'
import { ref, toRaw } from 'vue';
import Setting from "../common/userSetting.js";
import Util from "../common/utils.js";
import chromeService from '../common/chromeService.js';

import AppHeader from '../components/AppHeader.vue';
import AppSidebar from '../components/AppSidebar.vue';
import BookmarkList from '../components/BookmarkList.vue';
import BookmarkDialog from '../components/BookmarkDialog.vue';
import StatusDialog from '../components/StatusDialog.vue';
import UserConfigDrawer from '../components/UserConfigDrawer.vue';

export default {
  name: 'BookmarkMgr',
  components: {
    ElContainer,
    ElAside,
    ElMain,
    AppHeader,
    AppSidebar,
    BookmarkList,
    BookmarkDialog,
    StatusDialog,
    UserConfigDrawer
  },
  props: {

    statistics: {
      type: Object,
      default: () => ({})
    },
    setting: {
      type: Object,
      required: true
    },
    userSetting: {
      type: Object,
      default: () => ({})
    },
    providers: {
      type: Array,
      default: () => []
    },
    bookmarkStatus: {
      type: Array,
      default: () => []
    }
  },
  emits: ['reload', 'update:setting', 'switch-view', 'update-statistics-show'],
  setup() {
    const { t, locale } = useI18n({
      inheritLocale: true,
      useScope: 'local'
    })
    const sidebarRef = ref(null);
    const bookmarkListRef = ref(null);
    return { t, locale, sidebarRef, bookmarkListRef }
  },
  data() {
    let _this = this;
    return {
      searchQuery: {
        prop: "all",
        value: "",
        options: [{
          value: 'all',
          label: _this.t('searchQuery.all')
        }, {
          value: 'tags',
          label: _this.t('searchQuery.tags')
        }, {
          value: 'title',
          label: _this.t('searchQuery.title')
        }, {
          value: 'metaTitle',
          label: _this.t('searchQuery.metaTitle')
        }, {
          value: 'metaKeywords',
          label: _this.t('searchQuery.metaKeywords')
        }, {
          value: 'metaDescription',
          label: _this.t('searchQuery.metaDescription')
        }, {
          value: 'url',
          label: _this.t('searchQuery.url')
        }],
      },
      showDir:false,
      showBookmarkDailog: false,
      showBookmarkStatusDailog: false,
      
      lastQueryParam: {
        prop: 'parentId',
        operator: 'eq',
        value: '1'
      },
      bookmark: {},
      originalBookmark: {},
      changeBookmarkStatus: {},
      
      // Drag and drop state
      isDragging: false,
      draggedBookmark: null,
      
      treeData: [{
        id: 0,
        tiltle: "书签"
      }],
      bookmarks: [],
      
      // Prompt debug state
      promptDebugInput: `[{
    "id": "1531",
    "title": "猿圈",
    "url": "http://www.oxcoder.com/",
    "currentUrl": "https://www.oxcoder.com/",
    "metaTitle": "猿圈-在线考试-在线面试-校招笔试系统-在线考试系统-线上视频面试-题库-命题服务-线上笔试-在线面试-show me bug-考试星-代码面试-在线笔试平台-技术能力评估",
    "metaKeywords": "在线考试,在线面试,校招笔试系统,showmebug, show me bug, 在线笔试, 技术面试, 面试题库, 在线面试复盘, 代码面试, 编程面试, 程序员招聘, 技术招聘, 代码测评, 模拟面试, 技术评估神器, 在线架构绘图, 在线白板面试, 技术能力评估, 技术招聘工具, 测评供应商, 视频面试供应商, 视频面试平台, 在线笔试平台, coding interview, 在线面试工具, 实习生招聘, 校招面试题, 校招笔试题, 网上考试系统,在线考试系统,在线考试题库,在线面试,线上视频面试,远程面试,校招题库,校招笔试出题,校招命题服务,在线题库,牛客,鹰眼,赛码,考试星,在线答题系统,在线培训系统,在线学习平台,企业内训, 线上笔试, 华信高科, 问卷星, 融智云考, 小艺帮, 考试云, eduline",
    "metaDescription": "国内领先的AI在线考试和AI在线面试一体化解决方案供应商。适用于企业、院校、事业单位进行校园招聘、社会招聘和在线培训等。支持程序员技术能力评估，帮助管理者识别团队技术强项弱点，帮助你的团队从技术上快速适应业务部门提出的技术要求。",
    "metaTags": ""
}]`,
      promptDebugOutPut: '',
      promptDebug: false
    };
  },
  mounted() {
    const _this = this;
    // Initial query for tree data
    chromeService.postMessage({
      action: Constant.PAGE_EVENT.QUERY_FOLDER
    });
    
    chromeService.addListener(async function (result) {
      if (result.action === Constant.PAGE_EVENT.QUERY_FOLDER) {
        _this.treeData = result.datas;
      } else if (result.action === Constant.PAGE_EVENT.STOP_CRAWL_META_ACK) {
        _this.setting.crawlStatus = "0";
        _this.reloadBookmarkPage();
      } else if (result.action === Constant.PAGE_EVENT.QUERY_BOOKMARKS) {
        _this.bookmarks = result.datas;
        _this.$emit('update-statistics-show', result.datas.length);
      } else if (result.action === Constant.PAGE_EVENT.DOWNLOAD_BOOKMARKS) {
        for (let i = result.datas.length - 1; i >= 0; i--) {
          delete result.datas[i].id;
        }
        let newJsonString = JSON.stringify(result.datas, null, 2);
        var blob = new Blob([newJsonString], {type: 'application/json'});
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'data.json';
        a.click();
      } else if (result.action === Constant.PAGE_EVENT.SAVE_TO_D1) {
        LLM_M.summarizeTags(JSON.stringify(result.datas[0]));
      }
    });
  },
  methods: {
    locationDir(data){
      if (this.sidebarRef) {
        this.sidebarRef.setCurrentKey(data.parentId);
      }
      return;
    },
    
    handleNodeDrop(draggingNode, dropNode, dropType, ev) {
      const dragData = ev.dataTransfer?.getData('text/plain');
      if (!dragData) return;
      try {
        const bookmarkData = JSON.parse(dragData);
        if (bookmarkData.type === 'bookmark' && dropNode.data.type === 'folder') {
          this.moveBookmarkToFolder(bookmarkData, dropNode.data);
        }
      } catch (error) {
        console.error('处理节点拖拽失败:', error);
      }
    },
    
    handleFolderDrop(event, folderData) {
      event.preventDefault();
      
      if (!this.isDragging || !this.draggedBookmark) {
        return;
      }
      
      // Check if dropped on same folder
      if (this.draggedBookmark.id === folderData.id
        || this.draggedBookmark.parentId === folderData.id
        ||  this.draggedBookmark.id === folderData.parentId
      ) {
        this.$message.info(this.t('tips.sameFolder'));
        return;
      }
      
      const dragData = event.dataTransfer?.getData('text/plain');
      if (!dragData) return;
      
      try {
        const itemData = JSON.parse(dragData);
        
        if (itemData.type === 'bookmark' && folderData.type === 'folder') {
          this.moveBookmarkToFolder(itemData, folderData);
        } else if (itemData.type === 'folder' && folderData.type === 'folder') {
          console.log('文件夹拖拽到左侧目录树，更换父目录');
          this.moveFolderToFolder(itemData, folderData);
        }
      } catch (error) {
        console.error('解析拖拽数据失败:', error);
      }
    },

    moveFolderToFolder(draggedFolder, targetFolder) {
      const _this = this;
      
      if (targetFolder.treeId && targetFolder.treeId.includes(draggedFolder.id)) {
        ElMessage({
          message: this.t('tips.cannotMoveToChild') || '不能将文件夹移动到其子文件夹中',
          type: 'warning',
        });
        return;
      }
      
      const updatedFolder = {
        ...draggedFolder,
        parentId: targetFolder.id,
        syncChrome: false,
        move: true,
        index: 0 
      };
      
      updatedFolder.treeId = targetFolder.treeId + "/" + targetFolder.id;
      updatedFolder.treeName = targetFolder.treeName + "/" + targetFolder.title;
      
      BookmarkManager.saveBookmarks([updatedFolder]).then(() => {
        ElMessage({
          message: _this.t('tips.moveSuccess') || '移动成功',
          type: 'success',
        });
        setTimeout(() => {
          _this.reloadBookmarkPage();
        }, 500);
      }).catch(error => {
        console.error('移动文件夹失败:', error);
        ElMessage({
          message: _this.t('tips.moveFailed') || '移动失败',
          type: 'error',
        });
      });
    },

    moveBookmarkToFolder(bookmarkData, targetFolder) {
      const _this = this;
      const bookmark = _this.bookmarks.find(b => b.id === bookmarkData.id);
      if (!bookmark) {
        ElMessage({
          message: _this.t('tips.bookmarkNotFound') || '未找到书签',
          type: 'error',
        });
        return;
      }
      
      if (bookmark.parentId === targetFolder.id) {
        ElMessage({
          message: _this.t('tips.sameFolder') || '书签已在该文件夹中',
          type: 'warning',
        });
        return;
      }
      
      bookmark.parentId = targetFolder.id;
      bookmark.syncChrome = false;
      bookmark.move = true;
      bookmark.index = 0;
      
      bookmark.treeId = targetFolder.treeId + "/" + targetFolder.id;
      bookmark.treeName = targetFolder.treeName + "/" + targetFolder.title;
      
      BookmarkManager.saveBookmarks([bookmark]).then(() => {
        ElMessage({
          message: _this.t('tips.moveSuccess') || '移动成功',
          type: 'success',
        });
        _this.reloadBookmarkPage();
      }).catch(error => {
        console.error('移动书签失败:', error);
        ElMessage({
          message: _this.t('tips.moveFailed') || '移动失败',
          type: 'error',
        });
      });
    },

    saveUserSetting() {
      const _this = this;
      Setting.setSysConfig(this.userSetting);
      LLM_M.clear();
      ElMessage({
        message: _this.t('tips.modifyUserSuccess'),
        type: 'success',
      });
      this.setting.showUserConfig = false;
    },
    saveBookmark() {
      const _this = this;
      if (!_this.bookmark.tags) {
        _this.bookmark.tags = [];
      }
      if (_this.bookmark.title != _this.originalBookmark.title
          || _this.bookmark.url != _this.originalBookmark.url) {
        _this.bookmark.syncChrome = false;
      }
      BookmarkManager.saveBookmarks([_this.bookmark]).then(() => {
        ElMessage({
          message: _this.t('tips.success'),
          type: 'success',
        })
        _this.reloadBookmarkPage();
        _this.showBookmarkDailog = false;
        _this.bookmark = {};
        _this.originalBookmark = {};
      })
    },
    editBookmark(data) {
      if(data){
        this.bookmark = {...data};
        this.originalBookmark = {...data}
      }
      this.showBookmarkDailog = true;
    },
    closeBookmarkDialog() {
      this.showBookmarkDailog = false;
    },
    
    moveBookMarkDir(draggingNode, dropNode, dropType, ev) {
      // Logic for tree node drag end (reordering folders in tree)
    },
    
    queryByDir(data) {
      console.log('BookmarkMgr: queryByDir', data)
      let _this = this;
      _this.showContextMenu = false;
      
      if (_this.searchQuery) {
        _this.searchQuery.value = '';
        if (_this.searchQuery.prop === undefined || _this.searchQuery.prop === null) {
          _this.searchQuery.prop = 'title';
        }
      }
      if (_this.statistics && Array.isArray(_this.statistics.selectStatus)) {
        _this.statistics.selectStatus = [];
      }
      _this.showDir = false;
      
      _this.lastQueryParam = {
        prop: 'parentId',
        operator: 'eq',
        value: data.id
      }
      chromeService.postMessage({
        action: Constant.PAGE_EVENT.QUERY_BOOKMARKS,
        ..._this.lastQueryParam
      });
    },
    reloadBookMark(){
      const _this = this;
      chromeService.postMessage({
        action: Constant.PAGE_EVENT.RELOAD_BOOKMARK
      });
    },
    crawlMeta() {
      const _this = this;
      Setting.getSysConfig().then(config => {
        if (config.llmEnabled && Util.hasEmptyProperty(config)) {
          ElMessage({
            message: _this.t('tips.modifyUserFirst'),
            type: 'error',
          });
          return;
        }
        _this.setting.crawlStatus = "1";
        chromeService.postMessage({
          action: Constant.PAGE_EVENT.CRAWL_META,
          prop: 'type',
          operator: 'eq',
          value: 'bookmark'
        });
      })
    },
    stopCrawlMeta() {
      this.setting.crawlStatus = "0";
      chromeService.postMessage({
        action: Constant.PAGE_EVENT.STOP_CRAWL_META
      });
    },
    searchBookmarks() {
      let _this = this;
      _this.showDir = !_this.searchQuery.value==''
      _this.statistics.selectStatus = [];
      _this.lastQueryParam = {
        prop: _this.searchQuery.prop,
        operator: 'like',
        value: _this.searchQuery.value
      };
      chromeService.postMessage({
        action: Constant.PAGE_EVENT.QUERY_BOOKMARKS,
        ..._this.lastQueryParam
      });
    },
    searchStatisticsBookmarks(param) {
      console.log('BookmarkMgr: searchStatisticsBookmarks', param)
      let status = [];
      status.push(param.value);
      this.statistics.selectStatus = status;
      this.lastQueryParam = param;
      chromeService.postMessage({action: Constant.PAGE_EVENT.QUERY_BOOKMARKS, ...param});
    },
    downLoadBookmarks() {
      chromeService.postMessage({
        action: Constant.PAGE_EVENT.DOWNLOAD_BOOKMARKS,
        prop: 'id',
        operator: 'gt',
        value: -1
      });
    },
    handleFileUpload(file) {
      const _this = this;
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const bookmarks = JSON.parse(e.target.result);
          BookmarkManager.uploadBookMarks(bookmarks).then(() => {
            ElMessage({
              message: '上传成功!',
              type: 'success',
            });
            setTimeout(() => _this.reloadBookmarkPage(), 1000);
          })
        } catch (error) {
          console.error('解析书签文件失败:', error);
          ElMessage({
            message: '解析书签失败!',
            type: 'error',
          });
        }
      }
      reader.readAsText(file.raw)
    },
    handleEditModelChange(value){
      Util.setLocalStorageItem(Constant.ENV.SYS_PAGE_CONFIG,value);
    },
    reloadBookmarkPage() {
      this.$emit('reload');
    },
    showBookmarkStatus() {
      const _this = this;
      let datas = _this.bookmarkListRef.getCheckedNodes();
      if (datas && datas.length > 0) {
        _this.showBookmarkStatusDailog = true;
      } else {
        ElMessage({
          message: _this.t('tips.select'),
          type: 'error',
        });
      }
    },
    syncUrl(){
      const _this = this;
      let datas = _this.bookmarkListRef.getCheckedNodes();
      if (datas && datas.length > 0) {
        for (const bm of datas) {
          if(bm.status == -2){
            bm.syncChrome = false;
            bm.url = bm.currentUrl;
            bm.domain = bm.currentDomain;
            bm.status = 0;
          }
        }
        BookmarkManager.saveBookmarks(datas).then(() => {
          _this.showBookmarkStatusDailog = false;
          ElMessage({
            message: _this.t('tips.success'),
            type: 'success',
          });
          _this.reloadBookmarkPage();
        })
      } else {
        ElMessage({
          message: _this.t('tips.select'),
          type: 'error',
        });
      }
    },
    saveBookmarkStatus() {
      const _this = this;
      let datas = _this.bookmarkListRef.getCheckedNodes();
      if (datas && datas.length > 0) {
        for (const bm of datas) {
          if(_this.changeBookmarkStatus.status){
            bm.status = _this.changeBookmarkStatus.status;
          }
          if(_this.changeBookmarkStatus.parentId){
            bm.syncChrome = false;
            bm.move = true;
            bm.parentId = _this.changeBookmarkStatus.parentId;
          }
        }
        BookmarkManager.saveBookmarks(datas).then(() => {
          _this.showBookmarkStatusDailog = false;
          ElMessage({
            message: _this.t('tips.success'),
            type: 'success',
            duration: 1000
          });
          _this.reloadBookmarkPage();
        })
      } else {
        ElMessage({
          message: _this.t('tips.select'),
          type: 'error',
        });
      }
    },
    handleCheckAll(val) {
      let _this = this;
      if (val) {
        this.bookmarkListRef.setCheckedKeys(_this.bookmarks.map(data => data.id))
      } else {
        this.bookmarkListRef.setCheckedKeys([])
      }
    },
    removeBookmark(data) {
      const _this = this;
      if(!data){
        data = this.originalBookmark;
      }
      BookmarkManager.deleteBookmarks([{...data, syncChrome: false}]).then(() => {
        ElMessage({
          message: _this.t('tips.success'),
          type: 'success',
        });
        _this.reloadBookmarkPage();
      })
    },
    removeAllCheck() {
      const _this = this;
      let datas = _this.bookmarkListRef.getCheckedNodes().map(node => toRaw(node));
      if(datas && datas.length > 0){
        BookmarkManager.deleteBookmarks(datas).then(() => {
          ElMessage({
            message: _this.t('tips.success'),
            type: 'success',
          });
          _this.reloadBookmarkPage();
        })
      }else{
        ElMessage({
          message: _this.t('tips.select'),
          type: 'error',
        });
      }

    },
    openUrl(data) {
      window.open(data.url, '_blank');
    },
    promptDebugRun() {
      const _this = this;
      _this.promptDebug = true;
      _this.promptDebugOutPut = '';
      LLM_M.chat(_this.promptDebugInput, _this.userSetting).then(res => {
        _this.promptDebugOutPut = res;
        _this.promptDebug = false;
      }).catch(err => {
        _this.promptDebugOutPut = err;
        _this.promptDebug = false;
      })
    }
  }
}
</script>

<style>
.bookmark-mgr-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.bookmark-mgr-container .el-container {
  height: 100vh;
}

.bookmark-mgr-container .el-main {
  overflow: hidden !important;
}

.el-tree-node.is-current > .el-tree-node__content {
  color: #dc3545 !important;
  font-weight: bold; 
}
.el-tree-node.is-current > .el-tree-node__content > .bookmark-node > .bookmark-title {
  font-weight: bold;
}
</style>
