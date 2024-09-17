<template>
  <el-container>
    <el-header height="40px" >
      <el-row style="width: 100%;">
        <el-col :span="4" style="display: flex;align-items: end;">
          <el-space :size="40" >
            <el-badge :max="10000" type="info" :value="statistics.total" title="书签总数">
              <el-icon size="20px">
                <Collection />
              </el-icon>
            </el-badge>

            <el-badge :max="10000" type="success"  :value="statistics.over"  title="已获取源数据书签数">
              <el-icon size="20px">
                <DocumentChecked />
              </el-icon>
            </el-badge>

            <el-badge :max="10000" type="danger"  :value="statistics.error"  title="异常书签数">
              <el-icon size="20px">
                <DocumentDelete />
              </el-icon>
            </el-badge>

            <el-badge :max="10000" type="danger"  :value="statistics.change"  title="网址发生变化">
              <el-icon size="20px">
                <Link />
              </el-icon>
            </el-badge>
          </el-space>
        </el-col>
        <el-col :span="10">
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
        </el-col>
        <el-col :span="6">
          <el-space >
            <el-button size="default" type="success" title="获取网页源数据" circle>
              <el-icon size="18"><Promotion/></el-icon>
            </el-button>
          </el-space>
        </el-col>
      </el-row>

    </el-header>
    <el-container style="height: 92vh">
      <el-aside
          :style="{ width: '300px',borderRight:'3px solid var(--el-border-color)' }"
      >
            <el-scrollbar>
              <el-tree :data="treeData"
                       :expand-on-click-node="false"
                       default-expand-all
                       draggable
                       node-key="id"
                       @node-click="handleNodeClick">
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
                              目录：{{ data.treeName }}
                            </template>
                            <el-text class="dir-text">
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
                              当前网址：{{ data.currentUrl }}
                            </template>
                          <el-text class="bookmark-text" truncated @dblclick="openUrl(data)">
                            {{ data.title ? data.title : data.url }}
                          </el-text>
                          </el-tooltip>
                        </template>
                      </el-col>
                      <el-col :span="3">
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
                      </el-col>
                    </el-row>
                  </template>

                </el-tree>
              </el-scrollbar>
            </el-main>
        </el-container>
    </el-container>
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
  ElTable,
  ElTableColumn,
  ElTree
} from 'element-plus';

const backgroundConn = chrome.runtime.connect({name: "index-background-connection"});


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
    },
    data() {
        return {
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
            }
        };
    },
    methods: {
        getFaviconUrl(siteUrl) {
            const url = new URL(chrome.runtime.getURL("/_favicon/"));
            url.searchParams.set("pageUrl", siteUrl);
            url.searchParams.set("size", "16");
            return url.toString();
        },
        handleNodeClick(data) {
          backgroundConn.postMessage({
            action: Constant.QUERY_BOOKMARKS,
            prop: 'parentId',
            operator: 'eq',
            value: data.id
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
      openUrl(data){
        window.open(data.url, '_blank');
      }
    },
    mounted() {
      const _this = this;

      backgroundConn.onMessage.addListener(function(result) {
        // 使用 `_this` 代替 `this`
        if (result.action === Constant.QUERY_CATALOG) {
          _this.treeData = result.datas;
        } else if (result.action === Constant.QUERY_BOOKMARKS) {
          _this.bookmarks = result.datas;
        } else if (result.action === Constant.STATISTICS_TOTAL) {
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
            if(data.url && data.currentUrl && data.url != data.currentUrl){
              change++;
            }
          }
          _this.statistics.total = total;
          _this.statistics.error = error;
          _this.statistics.over = over;
          _this.statistics.change = change;

        }
      });

      backgroundConn.postMessage({
        action: Constant.QUERY_CATALOG,
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

.dir-text, .bookmark-text {
  display: inline-block;
  color: initial; /* 初始颜色 */
  text-decoration: none; /* 无下划线 */
  width: 100%;
}
.bookmark-text:hover {
  color: #409EFF; /* 悬浮时的颜色 */
  text-decoration: underline; /* 悬浮时的下划线 */
  width: 100%;
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
