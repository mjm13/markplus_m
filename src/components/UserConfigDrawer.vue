<template>
  <el-drawer :model-value="modelValue" direction="rtl" @update:model-value="emit('update:modelValue', $event)">
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
                    :key="item.value"
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
              <el-button type="primary" v-show="userSetting.llmEnabled"  @click="showLLMTestDrawer = true">{{t('btn.test')}}</el-button>
              <el-drawer v-model="showLLMTestDrawer" size="28%">
                <el-form-item :label="t('userConfig.provider')">
                  <el-col :span="8">
                    <el-select v-model="userSetting.provider" >
                      <el-option
                          v-for="item in providers"
                          :key="item.value"
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
                        v-model="localPromptDebugInput"
                        :placeholder="t('userConfig.promptDebugInput')"
                        @input="emit('update:promptDebugInput', $event)"
                    />
                  </el-col>
                  <el-col :span="2" style="display: flex;justify-content: space-evenly;">
                    <el-icon v-if="!promptDebug"><DArrowRight /></el-icon>
                    <el-icon v-else><Loading /></el-icon>
                  </el-col>
                  <el-col :span="11">
                    <el-input
                        :rows="8"
                        type="textarea"
                        :placeholder="t('userConfig.promptDebugOutput')"
                        v-model="localPromptDebugOutPut"
                        @input="emit('update:promptDebugOutPut', $event)"
                    />
                  </el-col>
                </el-form-item>
                <template #footer>
                  <el-button type="primary" size="default" @click="emit('promptDebugRun')">{{ t('btn.test') }}</el-button>
                  <el-button  size="default" @click="showLLMTestDrawer=false">{{ t('btn.close') }}</el-button>
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
      <el-button type="primary" size="default" @click="emit('saveUserSetting')">{{ t('btn.save') }}</el-button>
      <el-button  size="default" @click="emit('update:modelValue', false)">{{ t('btn.close') }}</el-button>
    </template>
  </el-drawer>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { DArrowRight, Loading } from '@element-plus/icons-vue'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  userSetting: {
    type: Object,
    required: true
  },
  bookmarkStatus: {
    type: Array,
    required: true
  },
  providers: {
    type: Array,
    required: true
  },
  promptDebugInput: {
    type: String,
    default: ''
  },
  promptDebugOutPut: {
    type: String,
    default: ''
  },
  promptDebug: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:modelValue',
  'saveUserSetting',
  'promptDebugRun',
  'update:promptDebugInput',
  'update:promptDebugOutPut'
])

const showLLMTestDrawer = ref(false)
const localPromptDebugInput = ref(props.promptDebugInput)
const localPromptDebugOutPut = ref(props.promptDebugOutPut)

watch(() => props.promptDebugInput, (val) => {
  localPromptDebugInput.value = val
})

watch(() => props.promptDebugOutPut, (val) => {
  localPromptDebugOutPut.value = val
})
</script>
