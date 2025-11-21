<template>
  <el-container direction="vertical">
    <AppHeader
      :setting="setting"
      :search-query="searchQuery"
      :bookmark-status="bookmarkStatus"
      @search-bookmarks="searchBookmarks"
      @search-statistics-bookmarks="searchStatisticsBookmarks"
      @update:setting="(val) => Object.assign(setting, val)"
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
    />
    <el-container direction="horizontal" style="height: 90vh; display: flex; flex-direction: row !important; direction: ltr; justify-content: flex-start;">
      <el-aside :style="{ width: '300px', borderRight:'3px solid var(--el-border-color)' }">
        <AppSidebar
          ref="sidebarRef"
          :is-dragging="isDragging"
          :dragged-bookmark="draggedBookmark"
          @node-click="queryByDir"
          @node-drop="handleNodeDrop"
          @node-drag-end="moveBookMarkDir"
          @folder-drop="handleFolderDrop"
          @remove-bookmark="removeBookmark"
          @edit-bookmark="editBookmark"
        />
      </el-aside>
      <el-main style="padding-top: 10px;padding-bottom: 10px">
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
    @save-user-setting="saveUserSetting"
  />
</template>

<script>
import Constant from './common/constant.js';
import {
  ElContainer,
  ElAside,
  ElMain,
  ElMessage
} from 'element-plus';
import BookmarkManager from "./common/bookmarkManager.js";
import LLM_M from './common/llmutil.js';
import { useI18n } from 'vue-i18n'
import { nextTick, ref, toRaw } from 'vue';
import Setting from "./common/userSetting.js";
import Util from "./common/utils.js";
import chromeService from './common/chromeService.js';

// Import new components
import AppHeader from './components/AppHeader.vue';
import AppSidebar from './components/AppSidebar.vue';
import BookmarkList from './components/BookmarkList.vue';
import BookmarkDialog from './components/BookmarkDialog.vue';
import StatusDialog from './components/StatusDialog.vue';
import UserConfigDrawer from './components/UserConfigDrawer.vue';

export default {
  name: 'App',
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
      userSetting: {},
      providers:[
        {
          value: 'deepseek',
          label: 'DeepSeek',
        },
        {
          value: 'openai',
          label: 'OpenAI',
        },
        {
          value: 'anthropic',
          label: 'Anthropic',
        },
        {
          value: 'google',
          label: 'Google',
        },
        {
          value: 'mistral',
          label: 'Mistral',
        },
        {
          value: 'groq',
          label: 'Groq',
        },
        {
          value: 'together',
          label: 'Together',
        },{
          value: 'perplexity',
          label: 'Perplexity',
        }
      ],
      setting: {
        debug: import.meta.env.VITE_SETTING_DEBUG=='true',
        editModel: import.meta.env.VITE_SETTING_EDITMODEL=='true',
        showUserConfig: false,
        crawlStatus: "0"
      },
      bookmarkStatus: [
        {key: _this.t('bookmark.status_show.-99'), value: -99},
        {key: _this.t('bookmark.status_show.-3'), value: -3},
        {key: _this.t('bookmark.status_show.2'), value: 2},
        {key: _this.t('bookmark.status_show.-2'), value: -2},
        {key: _this.t('bookmark.status_show.-1'), value: -1},
        {key: _this.t('bookmark.status_show.0'), value: 0},
        {key: _this.t('bookmark.status_show.9'), value: 9},
        {key: _this.t('bookmark.status_show.404'), value: 404},
      ],
      treeData: [{
        id: 0,
        tiltle: "书签"
      }],
      statistics: {
        selectStatus: [],
        "404": 0,
        total: 0,
        error: 0,
        over: 0,
        pending: 0,
        change: 0,
        show: 0
      },
      bookmarks: [],
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
    };
  },
  methods: {
    locationDir(data){
      if (this.sidebarRef) {
        this.sidebarRef.setCurrentKey(data.parentId);
      }
      return;
    },
    
    // Drag and drop handlers that involve data manipulation or API calls
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

    initConnect(){
      let _this = this;
      // Use chromeService instead of direct connection
      chromeService.addListener(async function (result) {
        if (result.action === Constant.PAGE_EVENT.QUERY_FOLDER) {
          _this.treeData = result.datas;
        } else if (result.action === Constant.PAGE_EVENT.STOP_CRAWL_META_ACK) {
          _this.setting.crawlStatus = "0";
          _this.reloadBookmarkPage();
        } else if (result.action === Constant.PAGE_EVENT.QUERY_BOOKMARKS) {
          _this.bookmarks = result.datas;

          if (_this.setting.editModel) {
            var selectIds = [];
            if (_this.statistics.selectStatus.includes(-3)) {
              let map = {};
              for (let bm of _this.bookmarks) {
                let url =  bm.url?bm.url.replace(/(http|https):\/\//g, ''):"";
                if (map[url]) {
                  selectIds.push(bm.id);
                } else {
                  map[url] = bm.id;
                }
              }
            }else if(_this.statistics.selectStatus.includes(-1)){
              selectIds = _this.bookmarks.map(data => data.id);
            }
            setTimeout(() => {
              if(selectIds && _this.bookmarkListRef){
                _this.bookmarkListRef.setCheckedKeys(selectIds);
              }
            }, 300)

          } 
          _this.statistics.show = result.datas.length;
        } else if (result.action === Constant.PAGE_EVENT.ALERT_MSG) {
          ElMessage({
            message: result.msg,
            type: 'error',
          });
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
        }  else if (result.action === Constant.PAGE_EVENT.RELOAD_PAGE) {
          _this.reloadBookmarkPage();
        } else if (result.action === Constant.PAGE_EVENT.STATISTICS_TOTAL) {
          const { datas } = result;
          const stat = {
            total: datas.length,
            error: 0,
            "404": 0,
            same: 0,
            over: 0,
            change: 0,
            pending: 0
          };
          let treeData = [];
          let map =  datas.reduce((acc, data) => {
            acc[data.id] = data;
            if (data.type === 'folder') {
              data.childrenCount = 0;
              treeData.push(data);
            }
            return acc;
          }, {});

          let inputArr = [];
          for (const data of datas) {
            map[data.id] = data;
            if (map[data.parentId] != null) {
              map[data.parentId].childrenCount += 1;
            }
            if (data.type === 'folder'){
              continue;
            }
            if(inputArr.length<_this.userSetting.maxSummarizeTags && data.url && data.url.startsWith("http")){
              inputArr.push(data);
            }
            switch (data.status) {
              case -1: stat.error++; break;
              case 2:
              case 9: stat.over++; break;
              case -2: stat.change++; break;
              case -3: stat.same++; break;
              case 404: stat["404"]++;break;
              case 0:
                if(data.url && data.url.startsWith('http')){
                  stat.pending++;
                }
                break;
            }
          }
          
          _this.statistics = { ..._this.statistics, ...stat }
          _this.treeData = Util.getRootTree(treeData);
        }
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
      console.log('App: queryByDir', data)
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
      console.log('App: searchStatisticsBookmarks', param)
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
      let _this = this;
      chromeService.postMessage({
        action: Constant.PAGE_EVENT.QUERY_BOOKMARKS,
        ..._this.lastQueryParam
      });
      chromeService.postMessage({
        action: Constant.PAGE_EVENT.STATISTICS_TOTAL,
        prop: 'id',
        operator: 'gt',
        value: '0'
      });
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
    }
  },
  mounted() {
    const _this = this;
    _this.initConnect();
    Setting.getSysConfig().then(config => {
      _this.userSetting = config;
    });
    Util.getLocalStorageItem(Constant.ENV.SYS_PAGE_CONFIG).then(config => {
      _this.setting.editModel = config;
    })
    Util.getLocalStorageItem(Constant.ENV.SYS_CRAWL_STATUS).then(config => {
      if (config == undefined) {
        config = "0";
        Util.setLocalStorageItem(Constant.ENV.SYS_CRAWL_STATUS,"0");
      }
      _this.setting.crawlStatus = config;
    })
    _this.reloadBookmarkPage();
  },
  
  beforeUnmount() {
    // Cleanup handled in components
  }
}
</script>

<style>
.el-tree-node.is-current > .el-tree-node__content {
  color: #dc3545 !important;
  font-weight: bold; 
}
.el-tree-node.is-current > .el-tree-node__content > .bookmark-node > .bookmark-title {
  color: #dc3545 !important;
}

.el-popper.is-dark {
  max-width: 80%;
}
.bookmark_tips {
  min-width: 200px;
  max-width: 600px;
  display: block;
}
</style>
