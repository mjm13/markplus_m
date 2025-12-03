<template>
  <el-header height="50px" style="width: 100%;display: flex;flex-direction: row;padding: 0px;">
    <div style="width: 300px;align-self: end;padding-bottom: 14px;">
      <template v-if="setting.editModel">
        <div style="display: flex;width: 95%;flex-wrap: wrap;justify-content: space-between;">
          <el-badge v-if="setting.debug" :max="10000" :offset="[-5,0]" :value="statistics.total" :title="t('statistics.total')" type="info">
            <el-button style="padding: 5px;" type="default"
                       @click="searchStatisticsBookmarks({prop: 'parentId',operator: 'eq',value: '1'})">
              <el-icon size="20px">
                <Collection/>
              </el-icon>
            </el-button>
          </el-badge>

          <el-badge :max="10000" :offset="[-5,0]" :value="statistics['404']" :title="t('statistics.404')" type="info"
                    v-if="statistics['404']>0">
            <el-button  style="padding: 5px;" type="default"
                        @click="searchStatisticsBookmarks({prop: 'status',operator: 'eq',value: 404})">
              <el-icon size="20px">
                <Hide />
              </el-icon>
            </el-button>
          </el-badge>

          <el-button  style="padding: 5px;" type="default" :title="t('statistics.undo')"
                      @click="searchStatisticsBookmarks({prop: 'status',operator: 'eq',value: -99})">
            <el-icon size="20px">
              <MuteNotification/>
            </el-icon>
          </el-button>

          <el-badge :max="10000" :offset="[-5,0]" :value="statistics.pending" :title="t('statistics.pending')" type="info"
                    v-if="statistics.pending>0">
            <el-button style="padding: 5px;" type="default"
                       @click="searchStatisticsBookmarks({prop: 'status',operator: 'eq',value: 0})">
              <el-icon size="20px">
                <Compass/>
              </el-icon>
            </el-button>
          </el-badge>

          <el-badge :max="10000" :offset="[-5,0]" :value="statistics.over" :title="t('statistics.over')" type="success"
                    v-if="statistics.over>0">
            <el-button style="padding: 5px;" type="default"
                       @click="searchStatisticsBookmarks({prop: 'status',operator: 'in',value: [2,9]})">
              <el-icon size="20px">
                <CircleCheck/>
              </el-icon>
            </el-button>
          </el-badge>

          <el-badge :max="10000" :offset="[-5,0]" :value="statistics.same" :title="t('statistics.same')" type="warning"
                    v-if="statistics.same>0">
            <el-button style="padding: 5px;" type="default"
                       @click="searchStatisticsBookmarks({prop: 'status',operator: 'eq',value: -3})">
              <el-icon size="20px">
                <DocumentCopy/>
              </el-icon>
            </el-button>
          </el-badge>

          <el-badge :max="10000" :offset="[-5,0]" :value="statistics.change" :title="t('statistics.change')" type="warning"
                    v-if="statistics.change>0">
            <el-button style="padding: 5px;" type="default"
                       @click="searchStatisticsBookmarks({prop: 'status',operator: 'eq',value: -2})">
              <el-icon size="20px">
                <Warning/>
              </el-icon>
            </el-button>
          </el-badge>

          <el-badge :max="10000" :offset="[-5,0]" :value="statistics.error" :title="t('statistics.error')" type="danger"
                    v-if="statistics.error>0">
            <el-button style="padding: 5px;" type="default"
                       @click="searchStatisticsBookmarks({prop: 'status',operator: 'eq',value: -1})">
              <el-icon size="20px">
                <CircleClose/>
              </el-icon>
            </el-button>
          </el-badge>
        </div>
      </template>
      <template v-else-if="!setting.editModel">
        <el-link href="https://github.com/mjm13/markplus_m" target="_blank" type="primary" style="margin-left: 20px;">
          <el-image fit="cover"
                    style="width: 32px; height: 32px"
                    src="src/assets/icons/icon48.png"
          />
          MarkPlus-M
        </el-link>
      </template>
    </div>
    <div style="width: calc(99% - 720px);align-self: center;padding-left: 20px;">
      <el-input v-model="searchQuery.value"
                size="default"
                style="width: 98%"
                @keydown.enter="searchBookmarks">
        <template #prefix>
          <el-checkbox
              style="padding-left: 3px;border-right: 1px solid rgb(220, 223, 230);padding-right: 10px;"
              v-if="setting.editModel"
              @change="handleCheckAll"
          />
          <el-select
              v-model="searchQuery.prop"
              class="custom-select"
          >
            <el-option
                v-for="item in searchQuery.options"
                :key="item.value"
                :label="item.label"
                :value="item.value">
            </el-option>
          </el-select>
        </template>
        <template #suffix>
          <el-icon class="el-input__icon">
            <Search/>
          </el-icon>
        </template>
      </el-input>
    </div>
    <el-space style="width: 120px;" size="small">
      <el-switch v-model="setting.editModel" @change="handleEditModelChange">
        <template #active-action>
          <span>E</span>
        </template>
        <template #inactive-action>
          <span>R</span>
        </template>
      </el-switch>

      <template v-if="setting.editModel">
        <el-button circle size="default" :title="t('btn.crawlMeta')"  @click="crawlMeta"
                   v-if="setting.crawlStatus == '0'">
          <el-icon size="18">
            <Promotion/>
          </el-icon>
        </el-button>

        <el-button circle size="default" :title="t('btn.stopCrawlMeta')"  @click="stopCrawlMeta"
                   v-else-if="setting.crawlStatus == '1'">
          <el-icon size="18">
            <SwitchButton/>
          </el-icon>
        </el-button>

        <el-button circle size="default" :title="t('btn.userConfig')"  @click="showUserConfig">
          <el-icon size="18">
            <Setting/>
          </el-icon>
        </el-button>


        <el-button circle size="default" :title="t('btn.showBookmarkStatus')"  @click="showBookmarkStatus">
          <el-icon size="18">
            <Edit/>
          </el-icon>
        </el-button>

        <el-popconfirm :title="t('confirm.deleteAll')"  width="200px"
                       @confirm="removeAllCheck">
          <template #reference>
            <el-button circle size="default" :title="t('btn.delSelect')"  >
              <el-icon size="18">
                <Delete/>
              </el-icon>
            </el-button>
          </template>
        </el-popconfirm>

        <el-button circle size="default" :title="t('btn.downloadBookmarks')" @click="downloadBookmarks">
          <el-icon size="18">
            <Download/>
          </el-icon>
        </el-button>

        <el-upload
            :auto-upload="false"
            :on-change="handleFileUpload"
            :show-file-list="false"
            action="#"
        >
          <el-button circle size="default" :title="t('btn.uploadBookmarks')">
            <el-icon size="18">
              <Upload/>
            </el-icon>
          </el-button>
        </el-upload>

        <el-popconfirm :title="t('confirm.reloadBookMark')" width="200px"
                       @confirm="reloadBookMark">
          <template #reference>
            <el-button circle size="default" :title="t('btn.reloadBookMark')"  >
              <el-icon size="18">
                <RefreshLeft />
              </el-icon>
            </el-button>
          </template>
        </el-popconfirm>


      </template>

    </el-space>
  </el-header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Collection,
  Hide,
  MuteNotification,
  Compass,
  CircleCheck,
  DocumentCopy,
  Warning,
  CircleClose,
  Search,
  Promotion,
  SwitchButton,
  Setting,
  Edit,
  Delete,
  Download,
  Upload,
  RefreshLeft,
  DataLine
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
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
  }
})

const emit = defineEmits([
  'search-statistics-bookmarks',
  'search-bookmarks',
  'handle-check-all',
  'handle-edit-model-change',
  'crawl-meta',
  'stop-crawl-meta',
  'show-bookmark-status',
  'remove-all-check',
  'download-bookmarks',
  'reload-bookmark',
  'switch-view',
  'show-user-config',
  'upload-bookmarks'
])

const statistics = ref({
  selectStatus: [],
  "404": 0,
  total: 0,
  error: 0,
  over: 0,
  pending: 0,
  change: 0,
  show: 0,
  same: 0
})

let removeListener = null

const searchStatisticsBookmarks = (params) => {
  console.log('AppHeader: searchStatisticsBookmarks clicked', params)
  emit('search-statistics-bookmarks', params)
}
const searchBookmarks = () => emit('search-bookmarks')
const handleCheckAll = (val) => emit('handle-check-all', val)
const handleEditModelChange = (val) => emit('handle-edit-model-change', val)
const crawlMeta = () => emit('crawl-meta')
const stopCrawlMeta = () => emit('stop-crawl-meta')
const showBookmarkStatus = () => emit('show-bookmark-status')
const removeAllCheck = () => emit('remove-all-check')
const downloadBookmarks = () => emit('download-bookmarks')
const handleFileUpload = (file) => emit('upload-bookmarks', file)
const reloadBookMark = () => emit('reload-bookmark')
const showUserConfig = () => emit('show-user-config')

onMounted(() => {
  removeListener = chromeService.addListener((message) => {
    if (message.action === Constant.PAGE_EVENT.STATISTICS_TOTAL) {
      // Update statistics logic here
      // This logic was previously in App.vue, now moved here or handled by App.vue passing data?
      // Ideally, AppHeader should calculate its own stats or receive them.
      // Since the logic is complex and involves iterating over all bookmarks, 
      // maybe it's better to keep the calculation in App.vue for now or move it to a utility?
      // For now, let's assume App.vue still passes statistics or we duplicate the logic.
      // Wait, the plan said "Move statistics state (partially) and search logic to AppHeader".
      // Let's try to listen to STATISTICS_TOTAL and update local state.
      
      const { datas } = message;
      const stat = {
        total: datas.length,
        error: 0,
        "404": 0,
        same: 0,
        over: 0,
        change: 0,
        pending: 0
      };
      
      // Simplified logic for now, assuming datas contains status info
      for (const data of datas) {
         if (data.type === 'folder') continue;
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
      statistics.value = { ...statistics.value, ...stat }
    }
  })
})

onUnmounted(() => {
  if (removeListener) {
    removeListener()
  }
})


</script>

<style scoped>
.custom-select {
  width: 100px;
  border-right: 1px #DCDFE6FF solid;
}

.custom-select :deep(.el-select__wrapper) {
  box-shadow: none !important;
  min-height: 28px !important;
}
</style>
