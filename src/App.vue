<template>
    <el-container style="height: 95vh">
        <el-aside
            :style="{ width: '300px',borderRight:'3px solid var(--el-border-color)' }"
                 >
            <el-scrollbar>
                <el-tree :data="treeData"
                         default-expand-all
                         draggable
                         :expand-on-click-node="false"
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
        <el-container>
          <el-header height="30px">
                <el-space wrap>
                  <el-select v-model="searchQuery.prop" style="width: 80px;">
                        <el-option v-for="item in searchQuery.options" :key="item.value" :label="item.label"
                                   :value="item.value">
                        </el-option>
                    </el-select>
                  <el-input v-model="searchQuery.value"
                            placeholder="搜索书签"
                            style="width: 200px;" @keydown.enter="searchBookmarks"
                  ></el-input>

                </el-space>
            </el-header>
            <el-main>
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
                          <el-text>
                            {{ data.title }}
                          </el-text>
                        </template>
                        <template v-else>
                          <img :src="getFaviconUrl(data.url)" style="height: 1em;width:1em;margin-right: 20px"/>
                          <el-text style="width: 800px" truncated @dblclick="openUrl(data)">
                            {{ data.title ? data.title : data.url }}
                          </el-text>
                        </template>
                      </el-col>
                      <el-col :span="3">
                        <el-tooltip
                            :raw-content="true"
                            effect="light"
                            placement="top"
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
                          <el-icon color="#67C23A">
                            <InfoFilled/>
                          </el-icon>
                        </el-tooltip>

                        <template v-if="data.status === 2">
                          <el-icon color="#409efc">
                            <DocumentChecked/>
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
        ElButton
    },
    data() {
        return {
            treeData: [{
                id: 0,
                tiltle: "书签"
            }],
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
        }
      });

      backgroundConn.postMessage({
        action: Constant.QUERY_CATALOG,
        prop: 'type',
        operator: 'eq',
        value: 'folder'
      });
    }
};
</script>
<style scoped>
.bookmark-node {
  display: flex;
  align-items: center;
  font-size: 13px;
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
