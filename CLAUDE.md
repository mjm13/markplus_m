https://www.humanlayer.dev/blog/writing-a-good-claude-md
依据文章描述生成CLAUDE.md文件

# MarkPlus-M 项目指南

## 项目概述

**MarkPlus-M** 是一个 Chrome 浏览器扩展插件,用于增强书签管理功能。通过 AI 技术自动为书签生成标签,提供智能搜索和批量维护功能。

**核心价值**: 让书签管理更智能,通过 AI 自动分类和元数据抓取,帮助用户更好地组织和检索书签。

## 技术栈

### 前端框架
- **Vue 3** (Composition API) + **Element Plus** UI 组件库
- **Vite** 作为构建工具
- **Vue I18n** 支持中英文国际化

### Chrome 扩展
- **Manifest V3** 架构
- **Service Worker** 后台脚本
- 主要使用的 Chrome APIs: `bookmarks`, `storage`, `tabs`, `scripting`, `webNavigation`

### AI 集成
- `@google/generative-ai` - Google AI Studio (主要使用 Gemini 模型)
- `@themaximalist/llm.js` - 多 LLM 提供商统一接口 (支持 OpenAI, Anthropic, DeepSeek 等)

### 数据存储
- **IndexedDB** - 存储书签扩展信息(标签、状态、元数据)
- **Chrome Storage API** - 存储用户配置

## 项目结构

```
src/
├── App.vue                    # 主应用组件,视图切换逻辑
├── main.js                    # 应用入口
├── background/
│   └── service-worker.js      # 后台服务,监听书签变更
├── common/
│   ├── bookmarkManager.js     # 书签管理核心逻辑
│   ├── llmutil.js             # LLM 工具类,AI 标签生成
│   ├── userSetting.js         # 用户设置管理
│   └── utils.js               # 通用工具函数
├── components/
│   ├── BookmarkList.vue       # 书签列表(支持拖拽)
│   ├── BookmarkSidebar.vue    # 书签文件夹侧边栏
│   ├── UserConfigDrawer.vue   # 用户配置抽屉
│   └── ...                    # 其他组件
├── views/
│   ├── BookmarkView.vue       # 书签管理视图
│   └── DataMgr.vue            # 数据管理仪表板
└── i18n/                      # 国际化文件
```

## 开发工作流

### 启动开发环境
```bash
npm run dev
```
- 开发服务器运行在 `http://localhost:5173`
- 支持热更新 (HMR)
- 在 Chrome 中加载 `dist` 目录作为未打包扩展

### 构建生产版本
```bash
npm run build
```
- 输出到 `dist/` 目录
- 自动生成 `dist.zip` 用于 Chrome Web Store 上传

### 测试扩展
1. 打开 Chrome 扩展管理页面 (`chrome://extensions/`)
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序",选择 `dist` 目录

## 核心功能实现

### 书签管理
- **双向同步**: Chrome 书签 ↔ IndexedDB 扩展信息
- **批量操作**: 批量删除、批量更新状态、批量导出
- **拖拽移动**: 支持将书签拖拽到不同文件夹 (仅编辑模式)

### AI 标签生成
- 使用队列批处理机制,避免 API 频率限制
- 可配置提示词和模型选择
- 支持多种 LLM 提供商

### 元数据抓取
- 通过 `chrome.tabs` 临时打开标签页
- 注入脚本获取页面 meta 信息 (title, keywords, description)
- 可配置并发数控制

### 智能搜索
- 支持多维度搜索: 全文、标签、标题、URL、元数据
- 搜索结果可定位到书签在文件夹树中的位置

## 重要配置文件

### manifest.json
- Chrome 扩展清单文件
- 定义权限、图标、后台脚本等

### vite.config.js
- Vite 构建配置
- 包含 Chrome 扩展插件配置和 CSP 设置

### TECH_STACK.md
- 详细的技术栈说明文档
- 包含所有依赖库的用途和版本信息

## 开发注意事项

### Manifest V3 限制
- 必须使用 Service Worker,不能使用传统的 background page
- 内容安全策略 (CSP) 限制,需要在 manifest.json 中声明允许的外部连接

### 数据一致性
- 所有书签操作必须同时更新 Chrome 书签和 IndexedDB
- 注意并发操作的冲突处理

## 扩展文档

详细的技术细节和实现说明请参考:
- [TECH_STACK.md](file:///d:/Project/Self/markplus_m/TECH_STACK.md) - 完整技术栈文档
- [README.md](file:///d:/Project/Self/markplus_m/README.md) - 用户使用指南
- [chrome.md](file:///d:/Project/Self/markplus_m/chrome.md) - Chrome API 使用说明

## 常见任务
