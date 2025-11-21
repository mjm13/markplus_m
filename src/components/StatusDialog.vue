<template>
  <el-dialog :model-value="modelValue" width="500" @update:model-value="emit('update:modelValue', $event)">
    <el-form :model="changeBookmarkStatus" label-width="auto">
      <el-form-item :label="t('bookmark.folder')">
        <el-tree-select
            v-model="changeBookmarkStatus.parentId"
            :data="treeData"
            default-expand-all
            node-key="id"
            check-strictly
            :render-after-expand="true"
        >
          <template #default="{ node, data }">
            <div class="bookmark-node">
              <el-icon class="folder-icon">
                <Folder/>
              </el-icon>
              <el-text class="bookmark-title">{{ data.title }}</el-text>
            </div>
          </template>
        </el-tree-select>
      </el-form-item>
      <el-form-item :label="t('bookmark.status')">
        <el-select
            v-model="changeBookmarkStatus.status"
        >
          <el-option
              v-for="item in bookmarkStatus"
              :key="item.value"
              :label="item.key"
              :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="emit('saveBookmarkStatus')">{{ t('btn.save') }}</el-button>
        <el-button type="warning" v-if="lastQueryParam.prop=='status' && lastQueryParam.value==-2" @click="emit('syncUrl')">{{ t('btn.syncUrl') }}</el-button>
        <el-button @click="emit('update:modelValue', false)">{{ t('btn.close') }}</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup>
import { Folder } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  changeBookmarkStatus: {
    type: Object,
    required: true
  },
  treeData: {
    type: Array,
    default: () => []
  },
  bookmarkStatus: {
    type: Array,
    required: true
  },
  lastQueryParam: {
    type: Object,
    required: true
  }
})

const emit = defineEmits([
  'update:modelValue',
  'saveBookmarkStatus',
  'syncUrl'
])
</script>

<style scoped>
.bookmark-node {
  display: flex;
  align-items: center;
  font-size: 13px;
  width: 100%;
  line-height: 1.4;
  padding: 0;
  margin: 0;
  min-height: 28px;
}

.folder-icon {
  margin-right: 6px;
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  flex-shrink: 0;
}

.bookmark-title {
  margin-right: 6px;
  display: inline-flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  line-height: 1.4;
}
</style>
