<template>
  <el-container>
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
              <search/>
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

          <el-button circle size="default" :title="t('btn.userConfig')"  @click="setting.showUserConfig=true">
            <el-icon size="18">
              <Setting/>
            </el-icon>
          </el-button>


          <el-button circle size="default" :title="t('btn.showBookmarkStatus')"  @click="showBookmarkStatus">
            <el-icon size="18">
              <Edit/>
            </el-icon>
          </el-button>

          <el-button v-if="setting.debug" circle size="default" title="调试拖拽功能" @click="debugDragSetup">
            <el-icon size="18">
              <Tools/>
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

          <el-button circle size="default"   @click="downLoadBookmarks">
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
            <el-button circle size="default"  >
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
    <el-container style="height: 90vh">
      <el-aside
          :style="{ width: '300px',borderRight:'3px solid var(--el-border-color)' }"
      >
        <el-scrollbar ref="dirRefContainer">
          <el-tree ref="dirRef"
                   :data="treeData"
                   :expand-on-click-node="false"
                   default-expand-all
                   node-key="id"
                   :highlight-current="true"
                   :draggable="false"
                   :allow-drop="allowDrop"
                   @node-drop="handleNodeDrop"
                   @node-drag-end="moveBookMarkDir"
                   @node-contextmenu="handleRightClick"
                   @node-click="queryByDir">
            <template #default="{ node, data }">
              <div 
                class="folder-drop-zone-wrapper"
                @dragover="handleFolderDragOver"
                @drop="handleFolderDrop($event, data)"
                @dragleave="handleFolderDragLeave"
                @dragenter="dragOverFolder = data.id"
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
            <div class="menu-item" @click="removeBookmark(null)">{{ t('btn.del') }}</div>
            <div class="menu-item" @click="editBookmark(null)">{{ t('btn.edit') }}</div>
          </div>
        </el-scrollbar>
      </el-aside>
      <el-main style="padding-top: 10px;padding-bottom: 10px">
        <el-auto-resizer>
          <template #default="{ height, width }">
            <el-scrollbar style="border-radius: 4px;box-shadow: 0 2px 12px 0 #909399">
              <el-tree-v2 :data="bookmarks"
                          id="bookmarkList"
                          :highlight-current="true"
                          ref="bookmarkList"
                          :show-checkbox="setting.editModel"
                          :item-size="36"
                          :height="height-10"
                          node-key="id">
                <template #default="{ node, data }">
                  <div 
                    class="bookmark-row-compact"
                    @mouseover="handleMouseOver(data)"
                    @mounted="setupRowDrag($event, data)"
                    :class="{ 
                      'dragging': isDragging && draggedBookmark?.id === data.id,
                      'bookmark-draggable': setting.editModel && data.type === 'bookmark'
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
                            <el-text class="dir-text compact-text" @dblclick="queryByDir(data)" v-html="data.titleShow || data.title"/>
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
                            <el-text class="bookmark-text compact-text" truncated @dblclick="openUrl(data)" v-html="showTitle(data)"/>
                          </el-tooltip>
                        </template>
                        
                        <div class="bookmark-meta-inline">
                          <el-tag v-if="showDir" type="warning" size="small" class="compact-tag">{{data.treeName}}</el-tag>
                          
                          <div v-if="setting.editModel" class="bookmark-edit-buttons">
                            <el-button circle class="iconBtn compact-btn" :title="t('btn.locate')" type="warning" @click="locationDir(data)">
                              <el-icon>
                                <Location />
                              </el-icon>
                            </el-button>

                            <el-popconfirm :title="t('confirm.delete')" width="300px"
                                           @confirm="removeBookmark(data)">
                              <template #reference>
                                <el-button circle class="iconBtn compact-btn" :title="t('btn.del')" type="danger">
                                  <el-icon>
                                    <Delete/>
                                  </el-icon>
                                </el-button>
                              </template>
                            </el-popconfirm>
                            <el-button circle class="iconBtn compact-btn" :title="t('btn.edit')" type="primary" @click="editBookmark(data)">
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
            </el-scrollbar>
          </template>
        </el-auto-resizer>

        <el-badge :max="10000" :value="statistics.show" :title="t('statistics.show')" type="info"
                  style="position: absolute;top: 95%;left: 97%;z-index: 1000">
          <template #content="{ value }">
            {{ value }}
          </template>
        </el-badge>
      </el-main>
    </el-container>
  </el-container>

  <el-dialog v-model="showBookmarkDailog" :title="t('bookmarkDailog.dailogTitle')" width="800">
    <el-form :model="bookmark" label-width="auto" >
      <el-form-item :label="t('bookmark.title')">
        <el-input v-model="bookmark.title"/>
      </el-form-item>
      <template v-if="bookmark.type === 'folder'">
        <el-form-item :label="t('bookmark.treeName')">
          <el-input v-model="bookmark.treeName" disabled/>
        </el-form-item>
      </template>
      <template v-if="bookmark.type === 'bookmark'">
        <el-form-item :label="t('bookmark.url')">
          <el-input v-model="bookmark.url"/>
        </el-form-item>
        <el-form-item :label="t('bookmark.status')">
          <el-select
              v-model="bookmark.status"
          >
            <el-option
                v-for="item in bookmarkStatus"
                :key="item.value"
                :label="item.key"
                :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('bookmark.tags')">
          <el-space :size="10" style="width: 600px;" wrap>
            <el-tag
                v-for="tag in bookmark.tags"
                :key="tag"
                :disable-transitions="false"
                closable
                @close="handleClose(tag)"
            >
              {{ tag }}
            </el-tag>
            <el-input
                v-if="inputVisible"
                ref="InputRef"
                v-model="inputValue"
                class="w-10"
                size="small"
                @blur="handleInputConfirm"
                @keyup.enter="handleInputConfirm"
            />
            <el-button v-else class="button-new-tag" size="small" @click="showInput">
              +{{ t('bookmark.tags') }}
            </el-button>
          </el-space>
        </el-form-item>

        <el-form-item :label="t('bookmark.treeName')">
          <el-input v-model="bookmark.treeName" disabled/>
        </el-form-item>
        <el-form-item :label="t('bookmark.currentUrl')">
          <el-input v-model="bookmark.currentUrl" disabled/>
        </el-form-item>
        <el-form-item :label="t('bookmark.metaTitle')">
          <el-input v-model="bookmark.metaTitle" :disabled="!setting.debug"/>
        </el-form-item>
        <el-form-item :label="t('bookmark.metaKeywords')">
          <el-input v-model="bookmark.metaKeywords" disabled/>
        </el-form-item>
        <el-form-item :label="t('bookmark.metaDescription')">
          <el-input v-model="bookmark.metaDescription" autosize disabled type="textarea"/>
        </el-form-item>
      </template>
      <el-form-item :label="t('bookmark.dateAddedTime')">
        <el-input v-model="bookmark.dateAddedTime" disabled/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="saveBookmark">{{ t('btn.save') }}</el-button>
        <el-button @click="closeBookmarkDialog">{{ t('btn.close') }}</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>

  <el-dialog v-model="showBookmarkStatusDailog" width="500">
    <el-form :model="changeBookmarkStatus" label-width="auto">
      <el-form-item :label="t('bookmark.folder')">
        <el-tree-select
            v-model="changeBookmarkStatus.parentId"
            :data="treeData"
            default-expand-all
            node-key="id"
            check-strictly
            :render-after-expand="true"
        >
          <template #default="{ node, data }">
            <div class="bookmark-node">
              <el-icon class="folder-icon">
                <Folder/>
              </el-icon>
              <el-text class="bookmark-title">{{ data.title }}</el-text>
            </div>
          </template>
        </el-tree-select>
      </el-form-item>
      <el-form-item :label="t('bookmark.status')">
        <el-select
            v-model="changeBookmarkStatus.status"
        >
          <el-option
              v-for="item in bookmarkStatus"
              :key="item.value"
              :label="item.key"
              :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="saveBookmarkStatus">{{ t('btn.save') }}</el-button>
        <el-button type="warning" v-if="lastQueryParam.prop=='status' && lastQueryParam.value==-2" @click="syncUrl">{{ t('btn.syncUrl') }}</el-button>
        <el-button @click="showBookmarkStatusDailog=false">{{ t('btn.close') }}</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>



  <el-drawer v-model="setting.showUserConfig" direction="rtl">
    <template #header>
      {{ t('userConfig.title') }}
    </template>
    <template #default>
      <el-form :model="userSetting" label-width="auto" label-position="top">
        <el-form-item :label="t('userConfig.crawlQueueLength')" :title="t('userConfig.crawlQueueLength_title')">
          <el-slider
              v-model="userSetting.crawlQueueLength"
              :min="1"
              :max="30"
              :show-input="true"
          />
        </el-form-item>
        <el-form-item :label="t('userConfig.maxSummarizeTags')" :title="t('userConfig.maxSummarizeTags_title')">
          <el-slider
              v-model="userSetting.maxSummarizeTags"
              :min="1"
              :max="20"
              :show-input="true"
          />
        </el-form-item>
        <el-form-item :label="t('userConfig.crawlStatus')" :title="t('userConfig.crawlStatus_title')">
          <el-select
              v-model="userSetting.crawlStatus"
              multiple
              collapse-tags
              collapse-tags-tooltip
              :max-collapse-tags="3"
              placeholder="Select"
          >
            <el-option
                v-for="item in bookmarkStatus"
                :key="item.value"
                :label="item.key"
                :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('userConfig.llmEnabled')" label-position="left">
          <el-row style="width: 99%">
            <el-col :span="4">
              <el-switch v-model="userSetting.llmEnabled"/>
            </el-col>
            <el-col :span="5">
              <el-select v-model="userSetting.provider" v-show="userSetting.llmEnabled">
                <el-option
                    v-for="item in providers"
                    :label="item.label"
                    :value="item.value"
                >
                  <div style="display: flex;align-items: center;">
                    <el-image style="margin-right: 8px;width: 16px;height: 16px;background-color: #000" :src="'src/assets/icons/'+item.value+'.png'" />
                    <span style="padding-left: 10px">{{ item.label }}</span>
                  </div>
                </el-option>
                <template #label="{ label, value }">
                  <div style="display: flex;align-items: center;">
                    <span> <img style="margin-top: 6px;width: 16px;height: 16px;background-color: #000" :src="'src/assets/icons/'+value+'.png'" /> </span>
                  </div>
                </template>
              </el-select>
            </el-col>
            <el-col :span="1">
            </el-col>
            <el-col :span="9">
              <el-input  v-model="userSetting.providerModel" v-show="userSetting.llmEnabled"/>
            </el-col>
            <el-col :span="1">
            </el-col>
            <el-col :span="4" >
              <el-button type="primary" v-show="userSetting.llmEnabled"  @click="this.showLLMTestDrawer = true">{{t('btn.test')}}</el-button>
              <el-drawer v-model="this.showLLMTestDrawer" size="28%">
                <el-form-item :label="t('userConfig.provider')">
                  <el-col :span="8">
                    <el-select v-model="userSetting.provider" >
                      <el-option
                          v-for="item in providers"
                          :label="item.label"
                          :value="item.value"
                      >
                      <div style="display: flex;align-items: center;">
                        <el-image style="margin-right: 6px;width: 16px;height: 16px;background-color: #000" :src="'src/assets/icons/'+item.value+'.png'" />
                        <span style="padding-left: 10px">{{ item.label }}</span>
                      </div>
                      </el-option>
                      <template #label="{ label, value }">
                        <div style="display: flex;align-items: center;">
                          <span> <img style="margin-top: 6px;width: 16px;height: 16px;background-color: #000" :src="'src/assets/icons/'+value+'.png'" /> </span>
                          <span style="font-weight: bold;padding-left: 10px">{{ label }}</span>
                        </div>
                      </template>
                    </el-select>
                  </el-col>
                  <el-col :span="2" style="text-align: center">
                    /
                  </el-col>
                  <el-col :span="14">
                    <el-input v-model="userSetting.providerModel"/>
                  </el-col>
                </el-form-item>
                <el-form-item :label="t('userConfig.providerkey')">
                  <el-input v-model="userSetting.providerkey"/>
                </el-form-item>
                <el-form-item :label="t('userConfig.promt')" >
                  <el-input
                      v-model="userSetting.promt"
                      :rows="8"
                      type="textarea"
                  />
                </el-form-item>
                <el-form-item :label="t('userConfig.data')" >
                  <el-col :span="11">
                    <el-input
                        :rows="8"
                        type="textarea"
                        v-model="promptDebugInput"
                        :placeholder="t('userConfig.promptDebugInput')"
                    />
                  </el-col>
                  <el-col :span="2" style="display: flex;justify-content: space-evenly;">
                    <el-icon v-if="!this.promptDebug"><DArrowRight /></el-icon>
                    <el-icon v-else><Loading /></el-icon>
                  </el-col>
                  <el-col :span="11">
                    <el-input
                        :rows="8"
                        type="textarea"
                        :placeholder="t('userConfig.promptDebugOutput')"
                        v-model="promptDebugOutPut"
                    />
                  </el-col>
                </el-form-item>
                <template #footer>
                  <el-button type="primary" size="default" @click="this.promptDebugRun()">{{ t('btn.test') }}</el-button>
                  <el-button  size="default" @click="this.showLLMTestDrawer=false">{{ t('btn.close') }}</el-button>
                </template>
              </el-drawer>
            </el-col>
          </el-row>
        </el-form-item>
        <el-card v-show="userSetting.llmEnabled">
          <el-form-item :label="t('userConfig.providerkey')">
            <el-input v-model="userSetting.providerkey"/>
          </el-form-item>
          <el-form-item :label="t('userConfig.promt')">
            <el-input
                v-model="userSetting.promt"
                :rows="8"
                type="textarea"
            />
          </el-form-item>
        </el-card>
      </el-form>
    </template>
    <template #footer>
      <el-button type="primary" size="default" @click="saveUserSetting">{{ t('btn.save') }}</el-button>
      <el-button  size="default" @click="setting.showUserConfig=false">{{ t('btn.close') }}</el-button>
    </template>
  </el-drawer>
</template>

<script>
import Constant from './common/constant.js';
import {
  ElAside,
  ElButton,
  ElContainer,
  ElHeader,
  ElInput,
  ElLink,
  ElMain,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTree
} from 'element-plus';
import BookmarkManager from "./common/bookmarkManager.js";
import LLM_M from './common/llmutil.js';
import { useI18n } from 'vue-i18n'
import {nextTick, ref,toRaw} from 'vue';
import Setting from "./common/userSetting.js";
import Util from "./common/utils.js";
import {Delete, Tools} from "@element-plus/icons-vue";

let backgroundConn = null
const InputRef = ref(null);
export default {
  name: 'App',
  components: {
    Delete,
    Tools,
    ElContainer,
    ElAside,
    ElHeader,
    ElMain,
    ElTable,
    ElTableColumn,
    ElTree,
    ElLink,
    ElInput,
    ElButton,
    ElMessage
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
      showLLMTestDrawer: false,
      showContextMenu:false,
      promptDebug:false,
      promptDebugInput:"",
      promptDebugOutPut:"",
      menuLeft:0,
      menuTop:0,
      inputVisible: false,
      inputValue: '',
      lastQueryParam: {
        prop: 'parentId',
        operator: 'eq',
        value: '1'
      },
      bookmark: {},
      originalBookmark: {},
      changeBookmarkStatus: {},
      hoveredNode: null,
      isDragging: false,
      draggedBookmark: null,
      dragOverFolder: null,
      bookmarkRefs: new Map(),
      dragObserver: null
    };
  },
  methods: {
    showTitle(data){
      let title =  data.titleShow || data.title;
      let url =  data.urlShow || data.url;
      let str = title || url;
      return str;
    },
    locationDir(data){
      this.$refs.dirRef.setCurrentKey(data.parentId);
      this.$nextTick(() => {
        const nodeEl = document.querySelector(
          `.el-tree-node[data-key="${data.parentId}"]`
        );
        if (nodeEl) {
          // nodeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          nodeEl.scrollIntoView();
        } else {
          console.warn(`未找到ID为 ${data.parentId} 的节点`);
        }
      });
      return;
    },
    promptDebugRun(){
      let _this = this;
      _this.promptDebug = true;
      Setting.setSysConfig(this.userSetting).then( o => {
        LLM_M.summarizeTags(this.promptDebugInput).then(value => {
          _this.promptDebug = false;
          _this.promptDebugOutPut = value;
        });
      });

    },
    setupRowDrag(event, data) {
      // 这个方法在 el-row 挂载时不会被调用，因为 @mounted 不是有效事件
      // 我们改用其他方式
    },
    setupDragForBookmark(element, data) {
      console.log('setupDragForBookmark called:', { element, data: data?.id, editModel: this.setting.editModel });
      if (!element || !this.setting.editModel || data.type !== 'bookmark') {
        console.log('setupDragForBookmark skipped:', { hasElement: !!element, editModel: this.setting.editModel, type: data?.type });
        return;
      }
      
      console.log('Setting up drag for bookmark:', data.id, data.title);
      
      // 设置拖拽属性
      element.draggable = true;
      element.style.cursor = 'move';
      element.setAttribute('data-bookmark-id', data.id);
      element.classList.add('bookmark-draggable');
      
      // 移除之前的事件监听器（避免重复绑定）
      if (element._dragStartHandler) {
        element.removeEventListener('dragstart', element._dragStartHandler);
      }
      if (element._dragEndHandler) {
        element.removeEventListener('dragend', element._dragEndHandler);
        element.removeEventListener('dragcancel', element._dragEndHandler);
        element.removeEventListener('dragexit', element._dragEndHandler);
      }
      
      // 创建事件处理器，使用箭头函数保持 this 上下文
      element._dragStartHandler = (event) => {
        console.log('Drag start triggered for:', data.id);
        event.stopPropagation(); // 防止事件冒泡
        this.handleDragStart(event, data);
      };
      
      element._dragEndHandler = (event) => {
        console.log('Drag end triggered for:', data.id);
        this.handleDragEnd(event);
      };
      
      // 添加鼠标按下事件来确保拖拽能够开始
      element._mouseDownHandler = (event) => {
        console.log('Mouse down on draggable element:', data.id);
        // 确保元素可以被拖拽
        element.draggable = true;
      };
      
      // 添加事件监听器
      element.addEventListener('dragstart', element._dragStartHandler, { passive: false });
      element.addEventListener('dragend', element._dragEndHandler, { passive: false });
      element.addEventListener('mousedown', element._mouseDownHandler, { passive: false });
      
      // 添加拖拽取消监听器
      element.addEventListener('dragcancel', element._dragEndHandler, { passive: false });
      element.addEventListener('dragexit', element._dragEndHandler, { passive: false });
      
      // 添加拖拽悬停效果
      element.addEventListener('dragover', (event) => {
        event.preventDefault();
      }, { passive: false });
      
      console.log('Drag setup completed for:', data.id);
    },
    handleMouseOver(data) {
      // 鼠标悬浮时，记录当前节点的 ID
      this.hoveredNode = data.id;
    },
    handleDragStart(event, data) {
      console.log('handleDragStart called:', { 
        editModel: this.setting.editModel, 
        dataId: data?.id, 
        type: data?.type,
        eventType: event.type,
        target: event.target
      });
      
      if (!this.setting.editModel || data.type !== 'bookmark') {
        console.log('Drag start prevented:', { editModel: this.setting.editModel, type: data?.type });
        event.preventDefault();
        return false;
      }
      
      // 防止文本选中
      document.body.classList.add('dragging-active');
      
      console.log('Starting drag for bookmark:', data.id, data.title);
      
      this.isDragging = true;
      this.draggedBookmark = data;
      
      // 设置拖拽数据
      const dragData = {
        id: data.id,
        type: 'bookmark',
        title: data.title,
        url: data.url,
        parentId: data.parentId
      };
      
      console.log('Setting drag data:', dragData);
      
      try {
        event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
        event.dataTransfer.effectAllowed = 'move';
        console.log('Drag data set successfully');
      } catch (error) {
        console.error('Failed to set drag data:', error);
      }
      
      // 添加拖拽样式
      const bookmarkRow = event.target.closest('.el-row') || event.currentTarget;
      if (bookmarkRow) {
        console.log('Adding drag styles to row');
        bookmarkRow.classList.add('dragging');
        bookmarkRow.style.opacity = '0.5';
        bookmarkRow.style.transform = 'rotate(2deg)';
      } else {
        console.log('Could not find bookmark row element');
      }
      
      // 创建拖拽图像（可选）
      const dragImage = document.createElement('div');
      dragImage.textContent = `📖 ${data.title}`;
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
        console.log('Could not set drag image:', error);
      }
      
      setTimeout(() => {
        if (document.body.contains(dragImage)) {
          document.body.removeChild(dragImage);
        }
      }, 0);
      
      console.log('Drag start completed successfully');
      return true;
    },
    handleDragEnd(event) {
      console.log('handleDragEnd called, resetting all drag states');
      
      // 重置所有拖拽状态
      this.isDragging = false;
      this.draggedBookmark = null;
      this.dragOverFolder = null;
      
      // 恢复文本选择
      document.body.classList.remove('dragging-active');
      
      // 恢复所有可能的拖拽样式 - 使用更广泛的选择器
      const allRows = document.querySelectorAll('#bookmarkList .bookmark-row-compact, #bookmarkList [data-bookmark-type="bookmark"]');
      allRows.forEach(row => {
        row.style.opacity = '';
        row.style.transform = '';
        row.classList.remove('dragging');
        // 移除任何可能的拖拽相关属性
        row.style.removeProperty('opacity');
        row.style.removeProperty('transform');
      });
      
      // 清除所有文件夹的拖拽悬停状态
      const allFolders = document.querySelectorAll('.folder-drop-zone-wrapper');
      allFolders.forEach(folder => {
        folder.classList.remove('drag-over');
      });
      
      console.log('Drag end cleanup completed');
    },
    resetDragState() {
      console.log('Resetting drag state manually');
      
      // 重置所有拖拽状态
      this.isDragging = false;
      this.draggedBookmark = null;
      this.dragOverFolder = null;
      
      // 恢复文本选择
      document.body.classList.remove('dragging-active');
      
      // 恢复所有可能的拖拽样式 - 使用更广泛的选择器
      const allRows = document.querySelectorAll('#bookmarkList .bookmark-row-compact, #bookmarkList [data-bookmark-type="bookmark"]');
      allRows.forEach(row => {
        row.style.opacity = '';
        row.style.transform = '';
        row.classList.remove('dragging');
        // 移除任何可能的拖拽相关属性
        row.style.removeProperty('opacity');
        row.style.removeProperty('transform');
      });
      
      // 清除所有文件夹的拖拽悬停状态
      const allFolders = document.querySelectorAll('.folder-drop-zone-wrapper');
      allFolders.forEach(folder => {
        folder.classList.remove('drag-over');
      });
      
      console.log('Manual drag state reset completed');
    },
    handleFolderDragOver(event) {
      if (this.isDragging && this.draggedBookmark) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'move';
        
        // 确保拖拽悬停状态
        const wrapper = event.currentTarget;
        const folderId = wrapper.getAttribute('data-folder-id');
        if (folderId && this.dragOverFolder !== folderId) {
          this.dragOverFolder = folderId;
          console.log('Drag over folder:', folderId);
        }
      }
    },
    handleFolderDragLeave(event) {
      // 延迟清除，避免在子元素间移动时闪烁
      setTimeout(() => {
        if (!event.relatedTarget || !event.currentTarget || !event.currentTarget.contains(event.relatedTarget)) {
          console.log('Drag leave folder');
          this.dragOverFolder = null;
        }
      }, 100);
    },
    handleFolderDrop(event, folderData) {
      console.log('handleFolderDrop called:', { folderData: folderData?.id, isDragging: this.isDragging });
      
      event.preventDefault();
      this.dragOverFolder = null;
      
      if (!this.isDragging || !this.draggedBookmark) {
        console.log('Drop ignored - not dragging or no dragged bookmark');
        return;
      }
      
      // 检查是否拖拽到同一个父文件夹
      if (this.draggedBookmark.parentId === folderData.id) {
        console.log('Drop ignored - same parent folder');
        this.$message.info(this.t('tips.sameFolder'));
        return;
      }
      
      const dragData = event.dataTransfer?.getData('text/plain');
      console.log('Drag data received:', dragData);
      
      if (!dragData) {
        console.log('No drag data found');
        return;
      }
      
      try {
        const bookmarkData = JSON.parse(dragData);
        console.log('Parsed bookmark data:', bookmarkData);
        console.log('Target folder data:', folderData);
        
        if (bookmarkData.type === 'bookmark' && folderData.type === 'folder') {
          console.log('Moving bookmark to folder');
          this.moveBookmarkToFolder(bookmarkData, folderData);
        } else {
          console.log('Invalid drop - bookmark type:', bookmarkData.type, 'folder type:', folderData.type);
        }
      } catch (error) {
        console.error('解析拖拽数据失败:', error);
      }
    },
    allowDrop(draggingNode, dropNode, type) {
      // 只允许拖拽到文件夹内部
      return type === 'inner' && dropNode.data.type === 'folder';
    },
    handleNodeDrop(draggingNode, dropNode, dropType, ev) {
      // 这个方法处理外部拖拽到树节点的情况
      const dragData = ev.dataTransfer?.getData('text/plain');
      if (!dragData) return;
      
      try {
        const bookmarkData = JSON.parse(dragData);
        if (bookmarkData.type === 'bookmark' && dropNode.data.type === 'folder') {
          this.moveBookmarkToFolder(bookmarkData, dropNode.data);
        }
      } catch (error) {
        console.error('解析拖拽数据失败:', error);
      }
    },
    moveBookmarkToFolder(bookmarkData, targetFolder) {
      const _this = this;
      
      // 找到要移动的书签
      const bookmark = _this.bookmarks.find(b => b.id === bookmarkData.id);
      if (!bookmark) {
        ElMessage({
          message: _this.t('tips.bookmarkNotFound') || '未找到书签',
          type: 'error',
        });
        return;
      }
      
      // 检查是否移动到相同文件夹
      if (bookmark.parentId === targetFolder.id) {
        ElMessage({
          message: _this.t('tips.sameFolder') || '书签已在该文件夹中',
          type: 'warning',
        });
        return;
      }
      
      // 更新书签的父文件夹
      bookmark.parentId = targetFolder.id;
      bookmark.syncChrome = false;
      bookmark.move = true;
      bookmark.index = 0; // 移动到目标文件夹的开头
      
      // 更新树路径信息
      bookmark.treeId = targetFolder.treeId + "/" + targetFolder.id;
      bookmark.treeName = targetFolder.treeName + "/" + targetFolder.title;
      
      // 保存更改
      BookmarkManager.saveBookmarks([bookmark]).then(() => {
        ElMessage({
          message: _this.t('tips.moveSuccess') || '移动成功',
          type: 'success',
        });
        // 刷新页面数据
        _this.reloadBookmarkPage();
      }).catch(error => {
        console.error('移动书签失败:', error);
        ElMessage({
          message: _this.t('tips.moveFailed') || '移动失败',
          type: 'error',
        });
      });
    },
    setupAllBookmarksDrag() {
      console.log('setupAllBookmarksDrag called, editModel:', this.setting.editModel);
      
      if (!this.setting.editModel) {
        console.log('Not in edit mode, skipping drag setup');
        return;
      }
      
      // 使用 MutationObserver 监听 DOM 变化，确保虚拟滚动的元素都被处理
      const setupDragWithObserver = () => {
        const treeContainer = document.querySelector('#bookmarkList');
        if (!treeContainer) {
          console.log('Tree container not found, retrying...');
          setTimeout(setupDragWithObserver, 100);
          return;
        }
        
        // 立即设置当前可见的书签
        this.setupVisibleBookmarksDrag();
        
        // 创建 MutationObserver 来监听新渲染的书签行
        if (this.dragObserver) {
          this.dragObserver.disconnect();
        }
        
        this.dragObserver = new MutationObserver((mutations) => {
          let hasNewBookmarkRows = false;
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // 检查是否有新的书签行
                const newBookmarkRows = node.querySelectorAll ? 
                  node.querySelectorAll('[data-bookmark-type="bookmark"]') : [];
                if (newBookmarkRows.length > 0 || 
                    (node.getAttribute && node.getAttribute('data-bookmark-type') === 'bookmark')) {
                  hasNewBookmarkRows = true;
                }
              }
            });
          });
          
          if (hasNewBookmarkRows) {
            console.log('New bookmark rows detected, setting up drag');
            setTimeout(() => this.setupVisibleBookmarksDrag(), 50);
          }
        });
        
        this.dragObserver.observe(treeContainer, {
          childList: true,
          subtree: true
        });
        
        console.log('Drag observer setup completed');
      };
      
      // 延迟执行以确保虚拟滚动组件已渲染
      setTimeout(setupDragWithObserver, 200);
    },
    
    setupVisibleBookmarksDrag() {
      if (!this.setting.editModel) {
        return;
      }
      
      console.log('Setting up drag for visible bookmarks');
      
      const treeContainer = document.querySelector('#bookmarkList');
      if (!treeContainer) {
        console.log('Tree container not found');
        return;
      }
      
      // 查找所有可见的书签行元素
      const bookmarkRows = treeContainer.querySelectorAll('[data-bookmark-type="bookmark"]');
      console.log('Found visible bookmark rows:', bookmarkRows.length);
      
      bookmarkRows.forEach((row) => {
        // 检查是否已经设置过拖拽
        if (row.hasAttribute('data-drag-setup')) {
          return;
        }
        
        const bookmarkId = row.getAttribute('data-bookmark-id');
        const bookmark = this.bookmarks.find(b => b.id === bookmarkId);
        
        if (bookmark && bookmark.type === 'bookmark') {
          console.log(`Setting up drag for bookmark:`, bookmark.id, bookmark.title);
          this.setupDragForBookmark(row, bookmark);
          row.setAttribute('data-drag-setup', 'true');
        }
      });
    },
    initConnect(){
      let _this = this;
      backgroundConn = chrome.runtime.connect({ name: "index-background-connection" });
      backgroundConn.onDisconnect.addListener(() => {
        console.log("联接失效")
        _this.initConnect();
      });
      backgroundConn.onMessage.addListener(async function (result) {
        // 使用 `_this` 代替 `this`
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
              if(selectIds){
                _this.$refs.bookmarkList.setCheckedKeys(selectIds);
              }
              // 重新设置拖拽功能
              console.log('Setting up drag after bookmark data update (edit mode)');
              _this.setupAllBookmarksDrag();
            }, 300)

          } else {
            // 即使不在编辑模式，也需要等待DOM更新后再设置拖拽
            setTimeout(() => {
              console.log('Setting up drag after bookmark data update (non-edit mode)');
              _this.setupAllBookmarksDrag();
            }, 300);
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
          // 创建 Blob 对象
          var blob = new Blob([newJsonString], {type: 'application/json'});
          // 创建下载链接
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
                  // console.log(data);
                  stat.pending++;
                }
                break;
            }
          }

          _this.promptDebugInput = JSON.stringify(inputArr, ['id','title','url','domainTitle','metaKeywords','metaDescription','metaTags'], 2);
          _this.statistics = { ..._this.statistics, ...stat }
          _this.treeData = Util.getRootTree(treeData);
        }
      });


    },
    handleClose(tag) {
      this.bookmark.tags.splice(this.bookmark.tags.indexOf(tag), 1)
    },
    showInput() {
      this.inputVisible = true;
      nextTick(() => {
        if (this.$refs.InputRef) {
          this.$refs.InputRef.input.focus(); // 调用 InputRef 并聚焦
        }
      })
    },
    handleInputConfirm() {
      if (!Array.isArray(this.bookmark.tags)) {
        this.bookmark.tags = [];
      }
      if (this.inputValue) {
        this.bookmark.tags.push(this.inputValue)
      }
      this.inputVisible = false
      this.inputValue = ''
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
    closeLLMTestDrawer(){
      this.showLLMTestDrawer = false;
    },
    closeBookmarkDialog() {
      this.showBookmarkDailog = false;
    },
    getFaviconUrl(siteUrl) {
      const url = new URL(chrome.runtime.getURL("/_favicon/"));
      url.searchParams.set("pageUrl", siteUrl);
      url.searchParams.set("size", "16");
      return url.toString();
    },
    handleRightClick(event, data, node){
      this.showContextMenu = true;
      this.menuLeft = event.clientX;
      this.menuTop = event.clientY;
      this.bookmark = {...data};
      this.originalBookmark = {...data}
      document.addEventListener('click', this.closeContextMenu)
    },
    closeContextMenu(){
      this.showContextMenu = false
      document.removeEventListener('click', this.closeContextMenu)
    },
    moveBookMarkDir(draggingNode, dropNode, dropType, ev) {
      //共四个参数，依次为：被拖拽节点对应的 Node、结束拖拽时最后进入的节点（可能为空）、被拖拽节点的放置位置（before、after、inner）、event
      //dropNode.parent.data  父节点
      //dropNode.data  当前节点
      // let bookmarks = [];
      // let result = [];
      // let bookmark = draggingNode.data;
      // bookmark.syncChrome = false;
      // bookmark.move = true;
      // if (dropType == 'inner') {
      //   bookmark.parentId = dropNode.data.id;
      //   bookmark.index = 0;
      //   bookmarks = dropNode.data.children;
      // } else if (dropType == 'before') {
      //   bookmark.parentId = dropNode.data.parentId;
      //   bookmark.index = dropNode.data.index - 1;
      //   bookmarks = dropNode.parent.data.children;
      // } else if (dropType == 'after') {
      //   bookmark.parentId = dropNode.data.parentId;
      //   bookmark.index = dropNode.data.index + 1;
      // }
      // if (bookmark.index < 0) {
      //   bookmark.index = 0;
      //
      //   for (let i = 0; i < bookmarks.length; i++) {
      //     if (bookmarks[i].type == "folder") {
      //       bookmarks[i].index = bookmarks[i].index + 1;
      //       bookmarks[i].syncChrome = false;
      //       bookmarks[i].move = true;
      //       result.push(bookmarks[i]);
      //     }
      //   }
      // }
      // result.push(bookmark);
      // BookmarkManager.saveBookmarks(result);
    },
    queryByDir(data) {
      let _this = this;
      _this.showContextMenu = false;
      _this.lastQueryParam = {
        prop: 'parentId',
        operator: 'eq',
        value: data.id
      }
      backgroundConn.postMessage({
        action: Constant.PAGE_EVENT.QUERY_BOOKMARKS,
        ..._this.lastQueryParam
      });
    },
    reloadBookMark(){
      const _this = this;
      backgroundConn.postMessage({
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
        backgroundConn.postMessage({
          action: Constant.PAGE_EVENT.CRAWL_META,
          prop: 'type',
          operator: 'eq',
          value: 'bookmark'
        });
      })

    },
    stopCrawlMeta() {
      this.setting.crawlStatus = "0";
      backgroundConn.postMessage({
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
      backgroundConn.postMessage({
        action: Constant.PAGE_EVENT.QUERY_BOOKMARKS,
        ..._this.lastQueryParam
      });
    },
    searchStatisticsBookmarks(param) {
      let status = [];
      status.push(param.value);
      this.statistics.selectStatus = status;
      this.lastQueryParam = param;
      backgroundConn.postMessage({action: Constant.PAGE_EVENT.QUERY_BOOKMARKS, ...param});
    },
    downLoadBookmarks() {
      backgroundConn.postMessage({
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
          console.error('Error parsing JSON: ', error);
          ElMessage({
            message: '解析书签失败!',
            type: 'error',
          });
        }
      }
      reader.readAsText(file.raw)
    },
    handleEditModelChange(value){
      console.log('Edit model changed to:', value);
      Util.setLocalStorageItem(Constant.ENV.SYS_PAGE_CONFIG,value);
      
      // 清理之前的观察器
      if (this.dragObserver) {
        this.dragObserver.disconnect();
        this.dragObserver = null;
      }
      
      // 清理所有现有的拖拽设置
      const allRows = document.querySelectorAll('[data-drag-setup="true"]');
      allRows.forEach(row => {
        row.removeAttribute('data-drag-setup');
        row.draggable = false;
        row.style.cursor = '';
        row.classList.remove('bookmark-draggable');
      });
      
      // 当编辑模式改变时，重新设置拖拽功能
      if (value) {
        setTimeout(() => {
          console.log('Setting up drag after edit mode change to true');
          this.setupAllBookmarksDrag();
        }, 200);
      } else {
        console.log('Edit mode disabled, drag functionality removed');
      }
    },
    reloadBookmarkPage() {
      let _this = this;
      
      // 清理拖拽引用和观察器
      _this.bookmarkRefs.clear();
      if (_this.dragObserver) {
        _this.dragObserver.disconnect();
        _this.dragObserver = null;
      }
      
      // 清理所有现有的拖拽设置
      const allRows = document.querySelectorAll('[data-drag-setup="true"]');
      allRows.forEach(row => {
        row.removeAttribute('data-drag-setup');
        row.draggable = false;
        row.style.cursor = '';
        row.classList.remove('bookmark-draggable');
      });
      
      backgroundConn.postMessage({
        action: Constant.PAGE_EVENT.QUERY_BOOKMARKS,
        ..._this.lastQueryParam
      });
      backgroundConn.postMessage({
        action: Constant.PAGE_EVENT.STATISTICS_TOTAL,
        prop: 'id',
        operator: 'gt',
        value: '0'
      });
    },
    
    // 调试方法：检查拖拽设置状态
    debugDragSetup() {
      console.log('=== Drag Setup Debug Info ===');
      console.log('Edit Model:', this.setting.editModel);
      console.log('Is Dragging:', this.isDragging);
      console.log('Dragged Bookmark:', this.draggedBookmark);
      console.log('Drag Observer:', !!this.dragObserver);
      
      const treeContainer = document.querySelector('#bookmarkList');
      console.log('Tree Container Found:', !!treeContainer);
      
      if (treeContainer) {
        const bookmarkRows = treeContainer.querySelectorAll('[data-bookmark-type="bookmark"]');
        const draggableRows = treeContainer.querySelectorAll('[data-drag-setup="true"]');
        console.log('Total Bookmark Rows:', bookmarkRows.length);
        console.log('Draggable Rows:', draggableRows.length);
        
        bookmarkRows.forEach((row, index) => {
          const bookmarkId = row.getAttribute('data-bookmark-id');
          const isDraggable = row.draggable;
          const hasDragSetup = row.hasAttribute('data-drag-setup');
          console.log(`Row ${index}: ID=${bookmarkId}, Draggable=${isDraggable}, Setup=${hasDragSetup}`);
        });
      }
      
      console.log('Total Bookmarks in Data:', this.bookmarks.length);
      console.log('=== End Debug Info ===');
    },
    showBookmarkStatus() {
      const _this = this;
      let datas = _this.$refs.bookmarkList.getCheckedNodes();
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
      let datas = _this.$refs.bookmarkList.getCheckedNodes();
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
      let datas = _this.$refs.bookmarkList.getCheckedNodes();
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
        this.$refs.bookmarkList.setCheckedKeys(_this.bookmarks.map(data => data.id))
      } else {
        this.$refs.bookmarkList.setCheckedKeys([])
      }
    },
    removeBookmark(data) {
      const _this = this;
      if(!data){
        data = this.originalBookmark;
      }
      if(data.childrenCount && data.childrenCount > 0){
        ElMessage({
          message: _this.t('tips.cub'),
          type: 'warning',
        });
        return;
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
      let datas = _this.$refs.bookmarkList.getCheckedNodes().map(node => toRaw(node));
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
    console.log('App component mounted');

    const _this = this;
    _this.initConnect();
    Setting.getSysConfig().then(config => {
      _this.userSetting = config;
      console.log("读取配置完成")
    });
    Util.getLocalStorageItem(Constant.ENV.SYS_PAGE_CONFIG).then(config => {
      _this.setting.editModel = config;
      console.log('Edit model loaded:', config);
    })
    Util.getLocalStorageItem(Constant.ENV.SYS_CRAWL_STATUS).then(config => {
      if (config == undefined) {
        config = "0";
        Util.setLocalStorageItem(Constant.ENV.SYS_CRAWL_STATUS,"0");
      }
      _this.setting.crawlStatus = config;
    })
    _this.reloadBookmarkPage();
    
    // 延迟设置拖拽功能，确保所有数据都已加载
    setTimeout(() => {
      console.log('Initial drag setup after mount');
      _this.setupAllBookmarksDrag();
    }, 1000);
    
    // 添加全局拖拽状态重置监听器
    _this.globalDragEndHandler = () => {
      console.log('Global dragend detected, ensuring cleanup');
      _this.resetDragState();
    };
    document.addEventListener('dragend', _this.globalDragEndHandler);
    
    // 添加ESC键监听器来取消拖拽
    _this.globalKeyHandler = (event) => {
      if (event.key === 'Escape' && _this.isDragging) {
        console.log('ESC pressed, canceling drag');
        _this.resetDragState();
      }
    };
    document.addEventListener('keydown', _this.globalKeyHandler);
  },
  
  beforeUnmount() {
    // 清理观察器
    if (this.dragObserver) {
      this.dragObserver.disconnect();
      this.dragObserver = null;
    }
    
    // 清理全局事件监听器
    if (this.globalDragEndHandler) {
      document.removeEventListener('dragend', this.globalDragEndHandler);
    }
    if (this.globalKeyHandler) {
      document.removeEventListener('keydown', this.globalKeyHandler);
    }
    
    // 清理所有拖拽相关的引用
    this.bookmarkRefs.clear();
    
    console.log('Component cleanup completed');
  }
};
</script>
<style>
.el-tree-node.is-current > .el-tree-node__content {
  color: #dc3545 !important;
  font-weight: bold; /* 加粗文字 */
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
<style scoped>
/* 修复树节点箭头位置 - 使用更强的选择器 */
:deep(.el-tree .el-tree-node .el-tree-node__expand-icon) {
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

/* 确保展开图标与内容对齐 - 使用更强的选择器 */
:deep(.el-tree .el-tree-node .el-tree-node__content) {
  align-items: center !important;
  padding: 6px 8px !important;
  display: flex !important;
  flex-direction: row !important;
  min-height: 28px !important;
  line-height: 1.4 !important;
  height: auto !important;
}

:deep(.el-tree .el-tree-node .el-tree-node__content .bookmark-node) {
  align-items: center !important;
  height: auto !important;
  line-height: 1.4 !important;
  display: flex !important;
  width: 100% !important;
}

:deep(.el-tree .el-tree-node .el-tree-node__content .bookmark-node .folder-icon) {
  align-self: center !important;
  line-height: 1 !important;
}

:deep(.el-tree .el-tree-node .el-tree-node__content .bookmark-node .bookmark-title) {
  align-self: center !important;
  line-height: 1.4 !important;
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
:deep(.el-tree-node__content) {
  position: relative;
}

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

/* 修复选中状态的样式问题 */
:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: transparent !important;
}

:deep(.el-tree-node.is-current > .el-tree-node__content .bookmark-node) {
  background-color: #f0f9ff !important;
  border-radius: 4px !important;
  padding: 2px 4px !important;
}

/* 防止选中状态影响图标显示 */
:deep(.el-tree-node.is-current > .el-tree-node__content .folder-icon) {
  color: #409eff !important;
}

:deep(.el-tree-node.is-current > .el-tree-node__content .bookmark-title) {
  color: #409eff !important;
  font-weight: bold !important;
}

/* 在全局样式文件中 */
.el-tag {
  --el-tag-font-size: 12px;
  --el-tag-padding: 4px 8px;
  height: auto;
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

.custom-tree-container {
  max-width: 500px;
  margin: 20px;
}
.custom-select {
  width: 100px;
  border-right: 1px #DCDFE6FF solid;
}

.custom-select :deep(.el-select__wrapper) {
  box-shadow: none !important;
  min-height: 28px !important;
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
}

/* 确保 bookmark-node 在 folder-drop-zone-wrapper 内正确对齐 */
.folder-drop-zone-wrapper .bookmark-node {
  height: 100%;
  min-height: 28px;
  display: flex !important;
  align-items: center !important;
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

/* Edge风格的紧凑书签行 */
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

.bookmark-row-compact .el-col {
  display: flex !important;
  align-items: center !important;
  min-height: 24px !important;
}

/* 书签内容列样式 */
.bookmark-content-col {
  display: flex !important;
  align-items: center !important;
  padding: 0 !important;
  flex: 1 !important;
  min-width: 0 !important;
  overflow: hidden !important;
}

/* 状态图标列样式 */
.bookmark-status-col {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  flex: 0 0 auto !important;
  width: 40px !important;
  height: 32px !important;
  padding: 0 4px !important;
  margin-left: 8px !important;
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

/* 紧凑的图标样式 */
.bookmark-row-compact .el-icon {
  margin-right: 8px !important;
  font-size: 14px !important;
  flex-shrink: 0;
}

/* 紧凑的文本样式 */
.bookmark-row-compact .bookmark-text,
.bookmark-row-compact .dir-text {
  font-size: 13px !important;
  line-height: 1.3 !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: calc(100% - 100px);
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

/* Edge风格的书签内容布局 - 已合并到上面的样式中 */

.bookmark-main-content {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
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
}

.bookmark-meta-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  flex-shrink: 0;
  min-width: fit-content;
  overflow: visible;
  padding: 2px 8px 2px 4px;
  white-space: nowrap;
  justify-content: flex-end;
}

/* 编辑按钮容器 - 始终占据空间但默认不可见 */
.bookmark-edit-buttons {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
}

/* 悬浮时显示编辑按钮 */
.bookmark-row-compact:hover .bookmark-edit-buttons {
  opacity: 1;
  visibility: visible;
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

/* 优化悬停效果 */
.bookmark-row-compact:hover .bookmark-meta-inline {
  opacity: 1;
}

.bookmark-meta-inline {
  opacity: 0.7;
  transition: opacity 0.2s ease;
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

.iconBtn .el-icon {
  font-size: 12px !important;
  margin: 0 !important;
}

.dir-text, .bookmark-text {
  display: inline-block;
  color: initial; /* 初始颜色 */
  text-decoration: none; /* 无下划线 */
  width: 900px;
}

.bookmark-text:hover {
  color: #409EFF; /* 悬浮时的颜色 */
  text-decoration: underline; /* 悬浮时的下划线 */
}

/* 已合并到上面的 .bookmark-node 样式中 */

.child-count-tag {
  font-size: 10px;
  height: 16px;
  line-height: 16px;
  padding: 0 4px;
}

/* 拖拽相关样式 */
.dragging {
  opacity: 0.5 !important;
  transform: rotate(2deg) !important;
  transition: all 0.2s ease;
}

.bookmark-draggable {
  cursor: move;
  transition: all 0.2s ease;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.bookmark-draggable:hover {
  background-color: #f5f7fa;
  border-radius: 4px;
}

.bookmark-draggable * {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.el-tree-node.is-drop-inner {
  background-color: #f0f9ff;
  border: 2px dashed #409eff;
}

.el-tree-node.is-drop-inner > .el-tree-node__content {
  background-color: #f0f9ff;
  color: #409eff;
}

/* 文件夹拖拽区域样式 */
.folder-drop-zone-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  cursor: pointer;
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
  /* 保持与默认状态相同的高度，不添加额外padding */
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
  content: "📁";
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #1890ff;
  z-index: 10;
}

/* 拖拽时禁用全局文本选择 */
body.dragging-active {
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
}

</style>
