<template>
    <el-container style="height: 95vh">
        <el-aside :style="{ width: asideWidth + 'px', cursor: 'ew-resize',borderRight:'3px solid #eee' }"
                  @mousedown="startDrag" @mouseup="stopDrag">
            <el-scrollbar>
                <el-tree :data="treeData" :props="defaultProps" @node-click="handleNodeClick"></el-tree>
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
                <el-table :data="bookmarks" style="width: 100%">
                    <el-table-column label="标题" prop="title" width="180">
                        <template #default="scope">
                            <el-link :href="scope.row.url" target="_blank">{{ scope.row.title }}</el-link>
                        </template>
                    </el-table-column>
                    <el-table-column label="URL" prop="url" width="300"></el-table-column>
                    <el-table-column label="关键词" prop="metaKeywords"></el-table-column>
                    <el-table-column label="描述" prop="metaDescription"></el-table-column>
                </el-table>
            </el-main>
        </el-container>
    </el-container>
</template>

<script>
import DBManager from './assets/lib/dbManager.js';
import Util from './assets/lib/utils.js';
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
            treeData: [],
            bookmarks: [],
            searchQuery: {
                prop: "",
                value: "aaa",
                options: [{
                    value: 'all',
                    label: '全局'
                }, {
                    value: 'title',
                    label: '备注'
                }, {
                    value: 'metaTitle',
                    label: '标题'
                }, {
                    value: 'metaKeywords',
                    label: '关键词'
                }, {
                    value: 'metaDescription',
                    label: '描述'
                }, {
                    value: 'url',
                    label: '网址'
                }],
            },
            defaultProps: {
                children: 'children',
                label: 'title'
            },
            asideWidth: 200, // 初始宽度
            isDragging: false, // 拖动状态
            startX: 0 // 鼠标起始位置
        };
    },
    methods: {
        startDrag(event) {
            event.preventDefault();
            this.isDragging = true;
            this.startX = event.clientX; // 记录鼠标起始位置
            document.addEventListener('mousemove', this.onDrag);
            document.addEventListener('mouseup', this.stopDrag);

        },
        onDrag(event) {
            event.preventDefault();
            if (this.isDragging) {
                const diffX = event.clientX - this.startX; // 计算鼠标移动的距离
                const newWidth = this.asideWidth + diffX; // 计算新的宽度
                // 设置最大和最小宽度
                const minWidth = 100; // 最小宽度
                const maxWidth = 700; // 最大宽度
                if (newWidth < minWidth) {
                    this.asideWidth = minWidth; // 设置为最小宽度
                    this.stopDrag(); // 触发停止拖动
                } else if (newWidth > maxWidth) {
                    this.asideWidth = maxWidth; // 设置为最大宽度
                    this.stopDrag(); // 触发停止拖动
                } else {
                    this.asideWidth = newWidth; // 更新宽度
                }

                this.startX = event.clientX;
            }

        },
        stopDrag() {
            if (this.isDragging) {
                this.isDragging = false;
                document.removeEventListener('mousemove', this.onDrag);
                document.removeEventListener('mouseup', this.stopDrag);

            }
        },
        handleNodeClick(data) {
            this.loadBookmarks(data.id);
        },
        loadBookmarks(treeId) {
            // 加载书签数据的逻辑
        },
        searchBookmarks() {

        },
        addBookmark() {

        },
        initBookMarks(){
            chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
                console.log("开始初始化书签");
                const bookmarks = Util.flattenBookmarkTree(bookmarkTreeNodes);
                console.log(bookmarks.length)
                DBManager.saveBookmarks(bookmarks)
                    .then(() => {
                        console.log("书签初始化完成");
                    })
                    .catch(error => {
                        console.error("初始化或验证书签时出错:", error);
                    });
            });
        },
        initTree() {
            DBManager.queryBookmarks({
                prop: 'type',
                operator: 'eq',
                value: 'folder'
            }).then((datas) => {
                this.treeData = Util.buildTree(datas).get(0).children;
            })
        }
    },
    mounted() {
        // this.initBookMarks();
        this.initTree();
    }
};
</script>
