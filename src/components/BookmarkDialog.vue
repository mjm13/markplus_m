<template>
  <el-dialog :model-value="modelValue" :title="t('bookmarkDailog.dailogTitle')" width="800" @update:model-value="emit('update:modelValue', $event)">
    <el-form :model="bookmark" label-width="auto" >
      <el-form-item :label="t('bookmark.title')">
        <el-input v-model="bookmark.title"/>
      </el-form-item>
      <template v-if="bookmark.type === 'folder'">
        <el-form-item :label="t('bookmark.treeName')">
          <el-input v-model="bookmark.treeName" disabled/>
        </el-form-item>
      </template>
      <template v-if="bookmark.type === 'bookmark'">
        <el-form-item :label="t('bookmark.url')">
          <el-input v-model="bookmark.url"/>
        </el-form-item>
        <el-form-item :label="t('bookmark.status')">
          <el-select
              v-model="bookmark.status"
          >
            <el-option
                v-for="item in bookmarkStatus"
                :key="item.value"
                :label="item.key"
                :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('bookmark.tags')">
          <el-space :size="10" style="width: 600px;" wrap>
            <el-tag
                v-for="tag in bookmark.tags"
                :key="tag"
                :disable-transitions="false"
                closable
                @close="emit('handleClose', tag)"
            >
              {{ tag }}
            </el-tag>
            <el-input
                v-if="inputVisible"
                ref="InputRef"
                v-model="localInputValue"
                class="w-10"
                size="small"
                @blur="handleInputConfirm"
                @keyup.enter="handleInputConfirm"
            />
            <el-button v-else class="button-new-tag" size="small" @click="emit('showInput')">
              +{{ t('bookmark.tags') }}
            </el-button>
          </el-space>
        </el-form-item>

        <el-form-item :label="t('bookmark.treeName')">
          <el-input v-model="bookmark.treeName" disabled/>
        </el-form-item>
        <el-form-item :label="t('bookmark.currentUrl')">
          <el-input v-model="bookmark.currentUrl" disabled/>
        </el-form-item>
        <el-form-item :label="t('bookmark.metaTitle')">
          <el-input v-model="bookmark.metaTitle" :disabled="!setting.debug"/>
        </el-form-item>
        <el-form-item :label="t('bookmark.metaKeywords')">
          <el-input v-model="bookmark.metaKeywords" disabled/>
        </el-form-item>
        <el-form-item :label="t('bookmark.metaDescription')">
          <el-input v-model="bookmark.metaDescription" autosize disabled type="textarea"/>
        </el-form-item>
      </template>
      <el-form-item :label="t('bookmark.dateAddedTime')">
        <el-input v-model="bookmark.dateAddedTime" disabled/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="emit('saveBookmark')">{{ t('btn.save') }}</el-button>
        <el-button @click="emit('closeBookmarkDialog')">{{ t('btn.close') }}</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  bookmark: {
    type: Object,
    required: true
  },
  bookmarkStatus: {
    type: Array,
    required: true
  },
  setting: {
    type: Object,
    required: true
  },
  inputVisible: {
    type: Boolean,
    default: false
  },
  inputValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'update:modelValue',
  'saveBookmark',
  'closeBookmarkDialog',
  'handleClose',
  'handleInputConfirm',
  'showInput',
  'update:inputValue'
])

const InputRef = ref(null)
const localInputValue = ref(props.inputValue)

watch(() => props.inputValue, (val) => {
  localInputValue.value = val
})

watch(localInputValue, (val) => {
  emit('update:inputValue', val)
})

watch(() => props.inputVisible, (val) => {
  if (val) {
    nextTick(() => {
      if (InputRef.value) {
        InputRef.value.input.focus()
      }
    })
  }
})

const handleInputConfirm = () => {
  emit('handleInputConfirm')
}
</script>

<style scoped>
.button-new-tag {
  margin-left: 10px;
  height: 32px;
  line-height: 30px;
  padding-top: 0;
  padding-bottom: 0;
}
.w-10 {
  width: 100px;
  margin-left: 10px;
  vertical-align: bottom;
}
</style>
