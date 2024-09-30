<template>
  <el-container>
    <el-header height="50px" style="width: 100%;display: flex;flex-direction: row;padding: 0px;">
      <div style="width: 300px;align-self: end;padding-bottom: 10px;">
        <el-space :size="30">
          <el-badge :max="10000" :offset="[-20,-9]" :value="statistics.total" title="书签总数" type="info">
            <el-button type="default" style="padding: 5px;"
                       @click="searchStatisticsBookmarks({prop: 'parentId',operator: 'eq',value: '1'})">
              <el-icon size="20px">
                <Collection/>
              </el-icon>
            </el-button>
          </el-badge>

          <el-badge :max="10000" :offset="[-20,-9]" :value="statistics.over" title="已获取源数据书签数" type="success">
            <el-button type="default" style="padding: 5px;"
                       @click="searchStatisticsBookmarks({prop: 'status',operator: 'eq',value: 2})">
            <el-icon size="20px">
              <DocumentChecked />
            </el-icon>
            </el-button>
          </el-badge>

          <el-badge :max="10000" :offset="[-20,-9]" :value="statistics.error" title="异常书签数" type="danger">
            <el-button type="default" style="padding: 5px;"
                       @click="searchStatisticsBookmarks({prop: 'status',operator: 'eq',value: -1})">
            <el-icon size="20px">
              <DocumentDelete />
            </el-icon>
            </el-button>
          </el-badge>

          <el-badge :max="10000" :offset="[-20,-9]" :value="statistics.change" title="网址发生变化" type="danger">
            <el-button type="default" style="padding: 5px;"
                       @click="searchStatisticsBookmarks({operator: 'staticUrlChange'})">
            <el-icon size="20px">
              <Link />
            </el-icon>
            </el-button>
          </el-badge>
        </el-space>
      </div>
      <div style="width: calc(100% - 800px);align-self: center;padding-left: 20px;">
        <el-input v-model="searchQuery.value"
                  placeholder="搜索书签"
                  size="default"
                  style="width: 98%"
                  @keydown.enter="searchBookmarks">
          <template #prefix>
            <el-select
                v-model="searchQuery.prop"
                class="custom-select"
                size="default"
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
      <div style="align-self: center;">
        <el-space >
          <el-switch v-model="setting.editModel">
            <template #active-action>
              <span>E</span>
            </template>
            <template #inactive-action>
              <span>R</span>
            </template>
          </el-switch>

          <el-button circle size="default" title="获取网页源数据" type="success" @click="crawlMeta">
            <el-icon size="18"><Promotion/></el-icon>
          </el-button>

          <el-button circle size="default" title="下载书签json" type="info" @click="downLoadBookmarks">
            <el-icon size="18"><Download /></el-icon>
          </el-button>

          <el-upload
              action="#"
              :auto-upload="false"
              :on-change="handleFileUpload"
              :show-file-list="false"
          >
            <el-button circle size="default" type="success" title="上传书签json">
              <el-icon  size="18"><Upload /></el-icon>
            </el-button>
          </el-upload>

        </el-space>
      </div>
    </el-header>
    <el-container style="height: 90vh">
      <el-aside
          :style="{ width: '300px',borderRight:'3px solid var(--el-border-color)' }"
      >
            <el-scrollbar>
              <el-tree :data="treeData"
                       :expand-on-click-node="false"
                       default-expand-all
                       draggable
                       node-key="id"
                       @node-click="queryByDir">
                <template #default="{ node, data }">
                  <div class="bookmark-node">
                    <el-icon class="folder-icon">
                      <Folder/>
                    </el-icon>
                    <span class="bookmark-title">{{ data.title }}</span>
                    <el-tag
                        :round="true"
                        class="child-count-tag"
                        size="small"
                        title="子节点数量"
                        type="info"
                    >
                      {{ data.childrenCount }}
                    </el-tag>
                  </div>
                </template>
              </el-tree>
            </el-scrollbar>
      </el-aside>
      <el-main style="padding-top: 10px;padding-bottom: 10px">
              <el-scrollbar style="border-radius: 4px;box-shadow: 0 2px 12px 0 #909399">
                <el-tree :data="bookmarks"
                         :expand-on-click-node="false"
                         default-expand-all
                         draggable
                         node-key="id">
                  <template #default="{ node, data }">
                    <el-row style="width: 100%">
                      <el-col :span="21">
                        <template v-if="data.type === 'folder'">
                          <el-icon style="margin-right: 20px;">
                            <Folder/>
                          </el-icon>
                          <el-tooltip
                              :raw-content="true"
                              placement="top"
                              trigger="click"
                          >
                            <template #content>
                              id：{{ data.id }}<br/>
                              标题：{{ data.title }}<br/>
                              目录：{{ data.treeName }}<br/>
                              创建时间：{{ data.dateAddedTime }}
                            </template>
                            <el-text class="dir-text" @dblclick="queryByDir(data)">
                            {{ data.title }}
                          </el-text>
                          </el-tooltip>
                        </template>
                        <template v-else>
                          <img :src="getFaviconUrl(data.url)" style="height: 1em;width:1em;margin-right: 20px"/>
                          <el-tooltip
                              :raw-content="true"
                              placement="top"
                              trigger="click"
                          >
                            <template #content>
                              id：{{ data.id }}<br/>
                              标题：{{ data.title }}<br/>
                              目录：{{ data.treeName }}<br/>
                              源标题：{{ data.metaTitle }}<br/>
                              源关键字：{{ data.metaKeywords }}<br/>
                              源描述：{{ data.metaDescription }}<br/>
                              源标签：{{ data.metaTags }}<br/>
                              原网址：{{ data.url }}<br/>
                              当前网址：{{ data.currentUrl }}<br/>
                              创建时间：{{ data.dateAddedTime }}
                            </template>
                            <el-text class="bookmark-text" truncated @dblclick="openUrl(data)">
                            {{ data.title ? data.title : data.url }}
                          </el-text>
                          </el-tooltip>
                        </template>
                      </el-col>
                      <el-col :span="3">
                        <template v-if="setting.editModel">
                          <el-popconfirm title="是否确定删除?目录会删除所有数据!" width="300px"
                                         @confirm="removeBookmark(data)">
                            <template #reference>
                              <el-button class="iconBtn" title="删除" type="danger">
                                <el-icon>
                                  <Delete/>
                                </el-icon>
                              </el-button>
                            </template>
                          </el-popconfirm>
                          <el-button class="iconBtn" title="编辑" type="primary" @click="editBookmark(data)">
                            <el-icon ><Edit /></el-icon>
                          </el-button>
                        </template>
                        <template v-if="setting.editModel===false">
                          <template v-if="data.status === 2">
                            <el-icon color="#409efc">
                              <DocumentChecked/>
                            </el-icon>
                          </template>
                          <template v-if="data.status === -1">
                            <el-icon color="#F56C6C">
                              <DocumentDelete/>
                            </el-icon>
                          </template>
                        </template>
                      </el-col>
                    </el-row>
                  </template>

                </el-tree>
              </el-scrollbar>
            </el-main>
        </el-container>
    </el-container>

  <el-dialog v-model="showBookmarkDailog" title="详情" width="500">
    <el-form :model="bookmark" label-width="auto">
      <el-form-item label="名称">
        <el-input v-model="bookmark.title"/>
      </el-form-item>
      <template v-if="bookmark.type === 'folder'">
        <el-form-item label="目录">
          <el-input v-model="bookmark.treeName" disabled/>
        </el-form-item>
      </template>
      <template v-if="bookmark.type === 'bookmark'">
        <el-form-item label="地址">
          <el-input v-model="bookmark.url"/>
        </el-form-item>
        <el-form-item label="标签">
          <el-space :size="10">
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
              +标签
            </el-button>
          </el-space>
        </el-form-item>

        <el-form-item label="目录">
          <el-input v-model="bookmark.treeName" disabled/>
        </el-form-item>
        <el-form-item label="当前地址">
          <el-input v-model="bookmark.currentUrl" disabled/>
        </el-form-item>
        <el-form-item label="源标题">
          <el-input v-model="bookmark.metaTitle" disabled/>
        </el-form-item>
        <el-form-item label="源关键字">
          <el-input v-model="bookmark.metaKeywords" disabled/>
        </el-form-item>
        <el-form-item label="源标签">
          <el-input v-model="bookmark.metaTags" disabled/>
        </el-form-item>
        <el-form-item label="源描述">
          <el-input v-model="bookmark.metaDescription" autosize disabled type="textarea"/>
        </el-form-item>
      </template>
      <el-form-item label="添加时间">
        <el-input v-model="bookmark.dateAddedTime" disabled/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="saveBookmark">保存</el-button>
        <el-button @click="closeBookmarkDialog">取消</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
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
import DBManager from "./common/dbManager.js";
import {nextTick, ref} from 'vue';

const backgroundConn = chrome.runtime.connect({name: "index-background-connection"});
const InputRef = ref(null);

export default {
    name: 'App',
    components: {
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
    data() {
        return {
            setting:{
              editModel: true
            },
            treeData: [{
                id: 0,
                tiltle: "书签"
            }],
            statistics:{
              total:0,
              error:0,
              over:0,
              change:0
            },
            bookmarks: [],
            searchQuery: {
              prop: "all",
                value: "",
                options: [ {
                  value: 'all',
                  label: '全部'
                }, {
                  value: 'tags',
                  label: '标签'
                }, {
                    value: 'title',
                    label: '标题'
                }, {
                    value: 'metaTitle',
                    label: '源标题'
                }, {
                    value: 'metaKeywords',
                    label: '源关键词'
                }, {
                    value: 'metaDescription',
                    label: '源描述'
                }, {
                    value: 'url',
                    label: '网址'
                }],
            },
          showBookmarkDailog: false,
          inputVisible: false,
          inputValue: '',
          bookmark: {},
          originalBookmark: {}
        };
    },
    methods: {
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
        if(!Array.isArray(this.bookmark.tags)){
          this.bookmark.tags = [];
        }
        if (this.inputValue) {
          this.bookmark.tags.push(this.inputValue)
        }
        this.inputVisible = false
        this.inputValue = ''
      },
      removeBookmark(data) {
        const _this = this;
        DBManager.deleteBookmarks([{...data}]).then(() => {
          ElMessage({
            message: '操作成功!',
            type: 'success',
          });
          _this.reloadBookmarkPage();
        })
      },
      saveBookmark() {
        const _this = this;
        if(!_this.bookmark.tags){
          _this.bookmark.tags = [];
        }
        if(_this.bookmark.title != _this.originalBookmark.title
            || _this.bookmark.url != _this.originalBookmark.url){
          _this.bookmark.syncChrome = false;
        }
        DBManager.saveBookmarks([{..._this.bookmark,tags:[..._this.bookmark.tags]}]).then(() => {
          ElMessage({
            message: '保存成功!',
            type: 'success',
          })
          _this.showBookmarkDailog = false;
          _this.bookmark = {};
          _this.originalBookmark = {};
        })
      },
      editBookmark(data) {
        this.bookmark = {...data};
        this.originalBookmark = {...data}
        this.showBookmarkDailog = true;
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
        queryByDir(data) {
          backgroundConn.postMessage({
            action: Constant.QUERY_BOOKMARKS,
            prop: 'parentId',
            operator: 'eq',
            value: data.id
          });
        },
        crawlMeta() {
          backgroundConn.postMessage({
            action: Constant.CRAWL_META,
            prop: 'type',
            operator: 'eq',
            value: 'bookmark'
          });
        },
        searchBookmarks() {
          let _this = this;
          backgroundConn.postMessage({
            action: Constant.QUERY_BOOKMARKS,
            prop: _this.searchQuery.prop,
            operator: 'like',
            value: _this.searchQuery.value
          });
        },
        searchStatisticsBookmarks(param) {
          let _this = this;
          backgroundConn.postMessage({action: Constant.QUERY_BOOKMARKS,...param});
        },
        downLoadBookmarks() {
          backgroundConn.postMessage({
            action: Constant.DOWNLOAD_BOOKMARKS,
            prop: 'id',
            operator: 'gt',
            value: -1
          });
        },
        handleFileUpload(file){
          const _this = this;
          const reader = new FileReader()
          reader.onload = (e) => {
            try {
              const bookmarks = JSON.parse(e.target.result);
              DBManager.saveBookmarks(bookmarks).then(() => {
                _this.reloadBookmarkPage();
                ElMessage({
                  message: '上传成功!',
                  type: 'success',
                })
              })
            } catch (error) {
              console.error('Error parsing JSON: ', error);
              ElMessage({
                message: '解析书签失败!',
                type: 'error',
              })
            }
          }
          reader.readAsText(file.raw)
        },
      reloadBookmarkPage() {
        backgroundConn.postMessage({
          action: Constant.QUERY_FOLDER,
          prop: 'type',
          operator: 'eq',
          value: 'folder'
        });
        backgroundConn.postMessage({
          action: Constant.QUERY_BOOKMARKS,
          prop: 'parentId',
          operator: 'eq',
          value: '1'
        });
        backgroundConn.postMessage({
          action: Constant.STATISTICS_TOTAL,
          prop: 'id',
          operator: 'gt',
          value: '0'
        });
      },
        openUrl(data){
          window.open(data.url, '_blank');
        }
    },
    mounted() {
      const _this = this;

      backgroundConn.onMessage.addListener(function(result) {
        // 使用 `_this` 代替 `this`
        if (result.action === Constant.QUERY_FOLDER) {
          _this.treeData = result.datas;
        } else if (result.action === Constant.QUERY_BOOKMARKS) {
          _this.bookmarks = result.datas;
        } else if(result.action === Constant.DOWNLOAD_BOOKMARKS){
          let newJsonString = JSON.stringify(result.datas, null, 2);
          // 创建 Blob 对象
          var blob = new Blob([newJsonString], { type: 'application/json' });
          // 创建下载链接
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'data.json';
          a.click();
        }else if (result.action === Constant.STATISTICS_TOTAL) {
          let total = result.datas.length;
          let error = 0;
          let over = 0;
          let change =0;
          for (let i = 0; i < result.datas.length; i++) {
            let data =  result.datas[i];
            if (data.status == -1) {
              error++;
            }else if(data.status == 2){
              over++;
            }
            if(data.domain && data.currentDomain && data.domain != data.currentDomain){
              change++;
            }
          }
          _this.statistics.total = total;
          _this.statistics.error = error;
          _this.statistics.over = over;
          _this.statistics.change = change;

        }
      });

      _this.reloadBookmarkPage();
    }
};
</script>
<style scoped>
.custom-select {
  width: 100px;
  border-right: 1px #DCDFE6FF solid;
  margin-left: -10px !important;
}

.custom-select :deep(.el-select__wrapper) {
  box-shadow: none !important;
  min-height: 28px !important;
}


.bookmark-node {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.iconBtn {
  --el-button-size: 15px;
  padding: 2px;
}
.dir-text, .bookmark-text {
  display: inline-block;
  color: initial; /* 初始颜色 */
  text-decoration: none; /* 无下划线 */
  width: 90%;
}
.bookmark-text:hover {
  color: #409EFF; /* 悬浮时的颜色 */
  text-decoration: underline; /* 悬浮时的下划线 */
  width: 90%;
}

.folder-icon {
  margin-right: 4px;
  color: #757575;
}

.bookmark-title {
  color: #333;
  margin-right: 6px;
}

.child-count-tag {
  font-size: 10px;
  height: 16px;
  line-height: 16px;
  padding: 0 4px;
}

</style>
