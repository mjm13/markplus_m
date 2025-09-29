# MarkPlus-M 技术栈与技术细节说明文档

## 项目概述
MarkPlus-M 是一个 Chrome 浏览器扩展插件，用于增强书签管理功能。通过 AI 技术自动为书签生成标签，提供智能搜索和批量维护功能。

## 核心技术栈

### 1. 前端框架与UI
- **Vue 3** (v3.4.37) - 主要前端框架，使用 Composition API
- **Element Plus** (v2.8.1) - UI 组件库
  - `@element-plus/icons-vue` (v2.3.1) - 图标组件
- **Vue I18n** (v11.0.0-rc.1) - 国际化支持
  - `@intlify/unplugin-vue-i18n` (v6.0.3) - Vite 插件支持
  - `vue-i18next` (v0.9.4) - 额外的国际化工具
  - `i18next-browser-languagedetector` (v8.0.2) - 浏览器语言检测

### 2. 构建工具与开发环境
- **Vite** (v5.4.1) - 现代化构建工具
  - `@vitejs/plugin-vue` (v5.1.2) - Vue 支持插件
  - `vite-plugin-remove-console` (v2.2.0) - 生产环境移除 console
  - `vite-plugin-static-copy` (v2.3.0) - 静态资源复制
- **@crxjs/vite-plugin** (v2.0.0-beta.25) - Chrome 扩展开发插件
- **Terser** (v5.33.0) - JavaScript 压缩工具

### 3. Chrome 扩展相关
- **Chrome Extension Manifest V3** - 使用最新的扩展清单版本
- **Chrome APIs**:
  - `chrome.bookmarks` - 书签管理 API
  - `chrome.storage` - 本地存储 API
  - `chrome.tabs` - 标签页管理 API
  - `chrome.scripting` - 脚本注入 API
  - `chrome.webNavigation` - 网页导航监听 API
  - `chrome.runtime` - 运行时通信 API
- **类型定义**:
  - `@types/chrome` (v0.0.270)
  - `chrome-types` (v0.1.301)

### 4. AI 集成与 LLM 支持
- **@google/generative-ai** (v0.21.0) - Google AI Studio 集成
- **@themaximalist/llm.js** (v0.8.0) - 多 LLM 提供商统一接口
- **支持的 AI 提供商**:
  - Google (Gemini)
  - OpenAI (GPT)
  - Anthropic (Claude)
  - DeepSeek
  - Mistral
  - Groq
  - Together
  - Perplexity

### 5. 数据存储
- **IndexedDB** - 浏览器本地数据库存储书签扩展信息
- **Chrome Storage API** - 存储用户配置和临时数据
- **本地存储架构**:
  - 书签基础信息同步 Chrome 书签
  - 扩展信息（标签、状态、元数据）存储在 IndexedDB
  - 用户配置存储在 Chrome Storage

## 项目结构

```
markplus_m/
├── src/
│   ├── App.vue                 # 主应用组件
│   ├── main.js                 # 应用入口
│   ├── assets/                 # 静态资源
│   │   └── icons/             # 图标文件
│   ├── background/            # 后台脚本
│   │   └── service-worker.js  # Service Worker
│   ├── common/                # 公共模块
│   │   ├── bookmarkManager.js # 书签管理器
│   │   ├── constant.js        # 常量定义
│   │   ├── llmutil.js         # LLM 工具类
│   │   ├── userSetting.js     # 用户设置管理
│   │   └── utils.js           # 工具函数
│   └── i18n/                  # 国际化文件
│       ├── en/                # 英文
│       └── zh/                # 中文
├── manifest.json              # 扩展清单文件
├── package.json              # 项目依赖
├── vite.config.js            # Vite 配置
└── index.html                # 主页面
```

## 核心功能模块

### 1. 书签管理 (BookmarkManager)
- **功能**: 书签的 CRUD 操作，与 Chrome 书签 API 同步
- **技术**: IndexedDB + Chrome Bookmarks API
- **特性**: 
  - 双向同步 Chrome 书签
  - 扩展信息存储
  - 批量操作支持

### 2. AI 标签生成 (LLMUtil)
- **功能**: 使用 AI 自动为书签生成标签
- **技术**: 多 LLM 提供商集成
- **特性**:
  - 队列批处理机制
  - 支持多种 AI 模型
  - 可配置提示词

### 3. 网页元数据抓取
- **功能**: 自动获取网页的 meta 信息
- **技术**: Chrome Scripting API + Content Script
- **抓取内容**:
  - 页面标题 (title)
  - 关键词 (meta keywords)
  - 描述 (meta description)
  - 自定义标签 (meta tags)

### 4. 智能搜索
- **功能**: 多维度书签搜索
- **搜索维度**:
  - 全文搜索
  - 标签搜索
  - 标题搜索
  - URL 搜索
  - 元数据搜索

### 5. 拖拽移动功能 (新增)
- **功能**: 通过拖拽将右侧书签移动到左侧文件夹
- **技术**: HTML5 Drag and Drop API + Vue 3 事件处理
- **特性**:
  - 仅在编辑模式下启用拖拽
  - 实时视觉反馈（拖拽高亮、悬停效果）
  - 自动同步 Chrome 书签结构
  - 支持跨文件夹移动
  - 防重复移动检测

## 开发配置

### 环境变量
```bash
# 开发环境 (.env.development)
VITE_SETTING_DEBUG = true
VITE_SETTING_EDITMODEL = true
```

### 构建脚本
```json
{
  "dev": "vite",           # 开发模式
  "build": "vite build",   # 生产构建
  "preview": "vite preview" # 预览构建结果
}
```

### Vite 配置特性
- **热更新**: 支持 HMR，端口 5173
- **代码分割**: 自动分割代码块
- **资源处理**: 静态资源自动复制
- **CSP 配置**: 适配 Chrome 扩展安全策略
- **虚拟模块**: 处理不兼容的依赖

## 权限配置

### Chrome 扩展权限
```json
{
  "permissions": [
    "favicon",        # 获取网站图标
    "bookmarks",      # 书签管理
    "storage",        # 本地存储
    "activeTab",      # 活动标签页
    "scripting",      # 脚本注入
    "webNavigation"   # 网页导航监听
  ],
  "host_permissions": ["<all_urls>"]  # 访问所有网站
}
```

### 内容安全策略 (CSP)
- 允许 WASM 执行
- 允许访问 Chrome favicon API
- 允许连接多个 AI 服务提供商 API
- 开发环境支持本地热更新

## 数据流架构

### 1. 书签同步流程
```
Chrome 书签变更 → Service Worker 监听 → IndexedDB 更新 → UI 刷新
```

### 2. 元数据抓取流程
```
用户触发 → 创建标签页 → 注入脚本 → 获取元数据 → 存储到 IndexedDB → 关闭标签页
```

### 3. AI 标签生成流程
```
书签入队列 → 批量处理 → 调用 LLM API → 解析结果 → 更新书签标签
```

### 4. 拖拽移动流程 (新增)
```
开始拖拽 → 设置拖拽数据 → 悬停文件夹高亮 → 释放到目标文件夹 → 更新书签父级 → 同步 Chrome → 刷新界面
```

## 国际化支持

### 支持语言
- 中文 (zh)
- 英文 (en)

### 实现方式
- Vue I18n 框架
- 自动检测浏览器语言
- 动态语言切换

## 开发注意事项

### 1. Chrome 扩展限制
- Manifest V3 要求使用 Service Worker
- 内容安全策略限制
- 跨域请求需要权限声明

### 2. AI 集成注意点
- API 密钥安全存储
- 请求频率限制
- 错误处理机制

### 3. 性能优化
- 队列批处理减少 API 调用
- 虚拟滚动处理大量书签
- 懒加载和代码分割

### 4. 数据一致性
- Chrome 书签与本地数据双向同步
- 并发操作的冲突处理
- 数据备份和恢复机制

## 部署与发布

### 构建产物
- `dist/` 目录包含所有构建文件
- 自动生成 `dist.zip` 用于 Chrome Web Store 上传
- 包含所有必要的静态资源和图标

### 发布流程
1. 执行 `npm run build` 构建项目
2. 上传 `dist.zip` 到 Chrome Web Store
3. 等待审核通过

这份文档涵盖了 MarkPlus-M 项目的所有核心技术栈和实现细节，可以作为后续 AI 辅助开发的重要参考资料。