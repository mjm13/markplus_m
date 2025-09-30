import Constant from './constant.js';

/**
 * 包含字段
 * crawlQueueLength:爬取队列长度
 * maxSummarizeTags:最大总结标签数量
 * crawlStatus: 爬取状态,空为所有，多个状态使用","分割
 * provider: llm厂商
 * providerkey: llm 密钥
 * @type {{getConfig: (function(): Promise<{[p: string]: any}>), setConfig: userSetting.setSysConfig}}
 */
const UserSetting={
    getSysConfig: async function(){
        let _this = this;
        return await chrome.storage.sync.get([Constant.ENV.SYS_SAVE_CONFIG]).then((result) => {
            let data = result[Constant.ENV.SYS_SAVE_CONFIG];
            if(!data){
                data = {
                    provider:"google",
                    llmEnabled: false,
                    providerkey:"",
                    providerModel:"learnlm-1.5-pro-experimental",
                    promt:"# 任务描述:\n" +
                        "从提供的网站书签JSON数据中提取最具代表性的标签。\n" +
                        "\n" +
                        "# 输入格式:\n" +
                        "输入为包含网站详细信息的JSON数组，每个元素为一个对象，包含如下字段：id、title、metaTitle、metaKeywords、metaDescription。\n" +
                        "重点关注 title、metaTitle、metaKeywords、metaDescription 字段。\n" +
                        "\n" +
                        "# 输出要求:\n" +
                        "输出必须为标准、合法的JSON数组，每个元素为对象。\n" +
                        "每个对象必须严格包含两个字段：\n" +
                        "\"id\": 对应原始输入中的id值。\n" +
                        "\"tags\": 一个字符串数组，包含5至7个标签。\n" +
                        "标签要求：\n" +
                        "使用中文（可包含英文短语，但主体现中文）。\n" +
                        "不得重复。\n" +
                        "标签应准确描述网站核心功能和特点，具有代表性。\n" +
                        "输出格式必须严格遵循下面的模板，不能有额外字段或遗漏：\n" +
                        "```json\n" +
                        "[{\n" +
                        "    \"id\": \"原始输入中的id\",\n" +
                        "    \"tags\": [\"标签1\", \"标签2\", \"标签3\", \"标签4\", \"标签5\"]\n" +
                        "}]\n" +
                        "```\n" +
                        "\n" +
                        "# 标签提取原则:\n" +
                        "优先从 metaTitle 中提取核心词。\n" +
                        "参考 metaKeywords 中的高频关键词。\n" +
                        "结合 metaDescription 理解网站主要功能。\n" +
                        "去除无实质意义的修饰词。\n" +
                        "合并相似含义的标签，保留最具识别度的表述方式。\n" +
                        "特别要求:\n" +
                        "输出的JSON必须完整且格式正确，确保每个对象均包含 id 和 tags 字段。\n" +
                        "返回的JSON中不得遗漏任何字段，也不允许修改字段名称或格式。\n" +
                        "请严格按照要求返回输出结果。\n" +
                        "示例:\n" +
                        "\n" +
                        "# 输入\n" +
                        "```json\n" +
                        "[{\n" +
                        "    \"id\": \"1531\",\n" +
                        "    \"title\": \"猿圈\",\n" +
                        "    \"url\": \"http://www.oxcoder.com/\",\n" +
                        "    \"currentUrl\": \"https://www.oxcoder.com/\",\n" +
                        "    \"metaTitle\": \"猿圈-在线考试-在线面试-校招笔试系统-在线考试系统-线上视频面试-题库-命题服务-线上笔试-在线面试-show me bug-考试星-代码面试-在线笔试平台-技术能力评估\",\n" +
                        "    \"metaKeywords\": \"在线考试,在线面试,校招笔试系统,showmebug, show me bug, 在线笔试, 技术面试, 面试题库, 在线面试复盘, 代码面试, 编程面试, 程序员招聘, 技术招聘, 代码测评, 模拟面试, 技术评估神器, 在线架构绘图, 在线白板面试, 技术能力评估, 技术招聘工具, 测评供应商, 视频面试供应商, 视频面试平台, 在线笔试平台, coding interview, 在线面试工具, 实习生招聘, 校招面试题, 校招笔试题, 网上考试系统,在线考试系统,在线考试题库,在线面试,线上视频面试,远程面试,校招题库,校招笔试出题,校招命题服务,在线题库,牛客,鹰眼,赛码,考试星,在线答题系统,在线培训系统,在线学习平台,企业内训, 线上笔试, 华信高科, 问卷星, 融智云考, 小艺帮, 考试云, eduline\",\n" +
                        "    \"metaDescription\": \"国内领先的AI在线考试和AI在线面试一体化解决方案供应商。适用于企业、院校、事业单位进行校园招聘、社会招聘和在线培训等。支持程序员技术能力评估，帮助管理者识别团队技术强项弱点，帮助你的团队从技术上快速适应业务部门提出的技术要求。\",\n" +
                        "    \"metaTags\": \"\"\n" +
                        "}]\n" +
                        "```\n" +
                        "# 输出\n" +
                        "```json\n" +
                        "[{\n" +
                        "   \"id\": \"1531\",\n" +
                        "   \"tags\": [\"oxcoder\", \"猿圈\", \"在线面试\", \"在线考试\", \"技术能力评估\"]\n" +
                        "}]\n" +
                        "```\n" +
                        "请严格按照以上提示词返回输出结果。",
                    crawlQueueLength:5,
                    maxSummarizeTags:3,
                    crawlStatus:[-1,0]
                };
                _this.setSysConfig(data);
            }else{
                data = JSON.parse(data);
            }
            if (!data.crawlQueueLength) {
                data.crawlQueueLength = 5;
            }
            if (!data.maxSummarizeTags) {
                data.maxSummarizeTags = 3;
            }
            return data;
        });
    },
    setSysConfig: async function(data){
        await chrome.storage.sync.set({[Constant.ENV.SYS_SAVE_CONFIG]:JSON.stringify(data)});
    },
    getPageConfig: async function(){
        return await chrome.storage.local.get([Constant.ENV.SYS_PAGE_CONFIG]).then((result) => {
            let data = result[Constant.ENV.SYS_PAGE_CONFIG];

            if(data==null){
                data = false;
                this.setPageConfig(false);
            }
            return data;
        });
    },
    setPageConfig: async function(data){
        await chrome.storage.local.set({[Constant.ENV.SYS_PAGE_CONFIG]:data});
    }
}

export default  UserSetting;
