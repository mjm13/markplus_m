import { createApp } from 'vue';
import App from './App.vue';
import ElementPlus from 'element-plus';
import { createI18n } from 'vue-i18n';
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css';
import en from './i18n/en/messages.json'
import zh from './i18n/zh/messages.json'
// import 'element-plus/theme-chalk/dark/css-vars.css'

const app = createApp(App);


const browserLocale = navigator.language.split('-')[0]

const i18n = createI18n({
    legacy: false, // 使用 Composition API 模式,禁用 v-t 等 legacy 指令
    globalInjection: true, // 允许全局注入 $t 等方法
    locale: browserLocale == "zh" ? browserLocale : 'en', // 如果支持浏览器语言,则使用,否则使用 'en'
    fallbackLocale: 'en', // 默认回退语言
    messages: {
        en, zh
    },
    fallbackWarn: false,
    missingWarn: false
});
app.use(i18n);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}
app.use(ElementPlus, { size: 'small' });

app.mount('#app');
