<template>
    <el-container style="height: 95vh">
        <el-aside
            :style="{ width: '300px',borderRight:'3px solid var(--el-border-color)' }"
                 >
            <el-scrollbar>
                <el-tree :data="treeData"
                         default-expand-all
                         draggable
                         node-key="id"
                         @node-click="handleNodeClick">
                        <template #default="{ node, data }">
                            <span class="custom-tree-node">
                              <span>
                                  <el-icon>
                                      <Folder/>
                                  </el-icon>
                                  {{ data.title }}
                              </span>
                              <span>
                              </span>
                            </span>
                        </template>
                </el-tree>
            </el-scrollbar>
        </el-aside>
        <el-container>
            <el-header style="border: 1px solid red ">
                <el-space wrap>
                    <el-select v-model="searchQuery.prop" placeholder="请选择" style="width: 80px;">
                        <el-option v-for="item in searchQuery.options" :key="item.value" :label="item.label"
                                   :value="item.value">
                        </el-option>
                    </el-select>
                    <el-input v-model="searchQuery.value" placeholder="搜索书签" style="width: 200px;"></el-input>

                    <el-button type="primary" @click="searchBookmarks">搜索</el-button>
                    <el-button type="success" @click="addBookmark">添加书签</el-button>
                </el-space>
            </el-header>
            <el-main>
                <el-table :data="bookmarks" stripe  style="width: 100%">
                    <el-table-column label="标题" prop="title" >
                        <template #default="scope">
                            <el-link :href="scope.row.url" target="_blank">
                                <img :src="getFaviconUrl(scope.row.url)" style="padding-right: 10px"/>
                                {{ scope.row.title? scope.row.title : scope.row.url }}
                            </el-link>
                        </template>
                    </el-table-column>
                    <el-table-column label="描述" prop="metaDescription" width="100"></el-table-column>
                </el-table>
            </el-main>
        </el-container>
    </el-container>
</template>

<script>
import DBManager from './common/dbManager.js';
import Util from './common/utils.js';
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
                prop: "",
                value: "",
                options: [ {
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
            asideWidth: 200, // 初始宽度
            isDragging: false, // 拖动状态
            startX: 0 // 鼠标起始位置
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
            let _this = this;
            DBManager.queryBookmarks({
                prop: 'parentId',
                operator: 'eq',
                value: data.id
            }).then((datas) => {
                _this.bookmarks = datas;
            })
        },
        searchBookmarks() {

        },
        initBookMarks() {
            let _this = this;
            chrome.bookmarks.getTree(async function (bookmarkTreeNodes) {
                console.log("开始初始化书签");
                const bookmarks = Util.flattenBookmarkTree(bookmarkTreeNodes);
                console.log(bookmarks.length)
                let dbCount = await DBManager.dbCount();
                if (dbCount == bookmarks.length) {
                    console.log("书签已初始化");
                } else {
                    await DBManager.saveBookmarks(bookmarks)
                        .catch(error => {
                            console.error("初始化或验证书签时出错:", error);
                        });
                }
                DBManager.queryBookmarks({
                    prop: 'type',
                    operator: 'eq',
                    value: 'folder'
                }).then((datas) => {
                    _this.treeData = Util.getRootTree(datas);
                })
            });
        }
    },
    mounted() {
        this.initBookMarks();
    }
};
</script>
