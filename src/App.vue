<template>
  <transition name="page-switch" mode="out-in">
    <keep-alive :include="['BookmarkMgr', 'DataMgr']">
      <component
        :is="currentView"
        :key="currentView"
        :statistics="statistics"
        :setting="setting"
        :user-setting="userSetting"
        :providers="providers"
        :bookmark-status="bookmarkStatus"
        @reload="reloadBookmarkPage"
        @update:setting="(val) => Object.assign(setting, val)"
        @update-statistics-show="(val) => statistics.show = val"
        @switch-view="toggleView"
      />
    </keep-alive>
  </transition>
  
  <!-- Corner Navigation Triggers -->
  <div 
    v-if="currentView === 'BookmarkMgr'" 
    class="corner-trigger top-right" 
    @click="toggleView"
    title="Go to Dashboard"
  ></div>
  <div 
    v-if="currentView === 'DataMgr'" 
    class="corner-trigger top-left" 
    @click="toggleView"
    title="Go to Bookmarks"
  ></div>
</template>

<script>
import Constant from './common/constant.js';
import { ElMessage } from 'element-plus';
import LLM_M from './common/llmutil.js';
import { useI18n } from 'vue-i18n'
import { ref, defineAsyncComponent } from 'vue';
import Setting from "./common/userSetting.js";
import Util from "./common/utils.js";
import chromeService from './common/chromeService.js';

// Import components
import BookmarkMgr from './views/BookmarkMgr.vue';
import DataMgr from './views/DataMgr.vue';

export default {
  name: 'App',
  components: {
    BookmarkMgr,
    DataMgr
  },
  setup() {
    const { t, locale } = useI18n({
      inheritLocale: true,
      useScope: 'local'
    })
    return { t, locale }
  },
  data() {
    let _this = this;
    return {
      currentView: 'BookmarkMgr',
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

      
      // Last query param needed for reloading
      
      // Last query param needed for reloading
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
      lastQueryParam: {
        prop: 'parentId',
        operator: 'eq',
        value: '1'
      },
    };
  },
  methods: {
    toggleView() {
      this.currentView = this.currentView === 'BookmarkMgr' ? 'DataMgr' : 'BookmarkMgr';
      Util.setLocalStorageItem('currentView', this.currentView);
    },
    
    initConnect(){
      let _this = this;
      // Use chromeService instead of direct connection
      chromeService.addListener(async function (result) {
        if (result.action === Constant.PAGE_EVENT.ALERT_MSG) {
          ElMessage({
            message: result.msg,
            type: 'error',
          });
        } else if (result.action === Constant.PAGE_EVENT.RELOAD_PAGE) {
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
        }
      });
    },

    reloadBookmarkPage() {
      let _this = this;
      // App.vue only handles global stats reload
      chromeService.postMessage({
        action: Constant.PAGE_EVENT.STATISTICS_TOTAL,
        prop: 'id',
        operator: 'gt',
        value: '0'
      });
      
      // Also trigger a default query for bookmarks if needed, 
      // but usually BookmarkMgr handles its own initial query.
      // However, on full reload, we might want to ensure data is there.
      // BookmarkMgr does its own query on mount.
    },
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

    Util.getLocalStorageItem('currentView').then(view => {
      if (view) _this.currentView = view;
    });
  },
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  width: 100vw;
  height: 100vh;
}

#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* Page transition effects */
.page-switch-enter-active,
.page-switch-leave-active {
  transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transform-style: preserve-3d;
  perspective: 1000px;
  position: absolute;
  width: 100%;
  height: 100vh;
  top: 0;
  left: 0;
}

.page-switch-enter-from {
  opacity: 0;
  transform: rotateY(90deg) scale(0.9);
}

.page-switch-leave-to {
  opacity: 0;
  transform: rotateY(-90deg) scale(0.9);
}

.page-switch-enter-active {
  z-index: 2;
}

.page-switch-leave-active {
  z-index: 1;
}

/* Corner Navigation Triggers */
.corner-trigger {
  position: absolute;
  top: 0;
  width: 50px;
  height: 50px;
  z-index: 9999;
  cursor: pointer;
  /* Visual indicator - optional, can be transparent if purely "hot corner" */
  /* background: rgba(255, 0, 0, 0.2);  Debug color */
  transition: all 0.3s ease;
}

.corner-trigger:hover {
  /* background: rgba(0, 0, 0, 0.1); */
}

/* Top Right Trigger (Main -> Dashboard) */
.corner-trigger.top-right {
  right: 0;
  /* Create a diagonal cut visual or just a hot zone */
  background: linear-gradient(225deg, #409eff 50%, transparent 50%);
  width: 60px;
  height: 60px;
  opacity: 0.3;
}

.corner-trigger.top-right:hover {
  opacity: 1;
  transform: scale(1.1);
}

/* Top Left Trigger (Dashboard -> Main) */
.corner-trigger.top-left {
  left: 0;
  background: linear-gradient(135deg, #409eff 50%, transparent 50%);
  width: 60px;
  height: 60px;
  opacity: 0.3;
}

.corner-trigger.top-left:hover {
  opacity: 1;
  transform: scale(1.1);
}
</style>
