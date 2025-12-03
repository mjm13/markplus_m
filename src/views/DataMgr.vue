<template>
  <div class="data-mgr-container">
    <el-container direction="vertical" style="height: 100vh; background-color: var(--el-bg-color);">
      <el-header height="auto" style="padding: 0; border-bottom: 1px solid var(--el-border-color);">
        <el-tabs v-model="activeTab" class="mgr-tabs">
          <el-tab-pane label="仪表盘" name="dashboard">
            <template #label>
              <span class="tab-label">
                <el-icon><DataAnalysis /></el-icon>
                <span>仪表盘</span>
              </span>
            </template>
          </el-tab-pane>
          <el-tab-pane label="批量操作" name="batch">
            <template #label>
              <span class="tab-label">
                <el-icon><Operation /></el-icon>
                <span>批量操作</span>
              </span>
            </template>
          </el-tab-pane>
        </el-tabs>
      </el-header>
      
      <el-main>
        <!-- 仪表盘页面 -->
        <div v-show="activeTab === 'dashboard'" class="tab-content">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <template #header>
                  <div class="card-header">
                    <el-icon><Collection /></el-icon>
                    <span>{{ t('statistics.total') || '总书签' }}</span>
                  </div>
                </template>
                <div class="card-value">{{ statistics.total || 0 }}</div>
              </el-card>
            </el-col>
            
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card success-card">
                <template #header>
                  <div class="card-header">
                    <el-icon><CircleCheck /></el-icon>
                    <span>{{ t('statistics.over') || '已完成' }}</span>
                  </div>
                </template>
                <div class="card-value">{{ statistics.over || 0 }}</div>
              </el-card>
            </el-col>
            
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card info-card">
                <template #header>
                  <div class="card-header">
                    <el-icon><Compass /></el-icon>
                    <span>{{ t('statistics.pending') || '待处理' }}</span>
                  </div>
                </template>
                <div class="card-value">{{ statistics.pending || 0 }}</div>
              </el-card>
            </el-col>
            
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card error-card">
                <template #header>
                  <div class="card-header">
                    <el-icon><CircleClose /></el-icon>
                    <span>{{ t('statistics.error') || '错误' }}</span>
                  </div>
                </template>
                <div class="card-value">{{ statistics.error || 0 }}</div>
              </el-card>
            </el-col>
          </el-row>
          
          <el-row :gutter="20" style="margin-top: 20px;">
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card warning-card">
                <template #header>
                  <div class="card-header">
                    <el-icon><Hide /></el-icon>
                    <span>{{ t('statistics.404') || '404' }}</span>
                  </div>
                </template>
                <div class="card-value">{{ statistics['404'] || 0 }}</div>
              </el-card>
            </el-col>
            
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card change-card">
                <template #header>
                  <div class="card-header">
                    <el-icon><Warning /></el-icon>
                    <span>{{ t('statistics.change') || '已变更' }}</span>
                  </div>
                </template>
                <div class="card-value">{{ statistics.change || 0 }}</div>
              </el-card>
            </el-col>
            
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card same-card">
                <template #header>
                  <div class="card-header">
                    <el-icon><DocumentCopy /></el-icon>
                    <span>{{ t('statistics.same') || '重复' }}</span>
                  </div>
                </template>
                <div class="card-value">{{ statistics.same || 0 }}</div>
              </el-card>
            </el-col>
            
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card show-card">
                <template #header>
                  <div class="card-header">
                    <el-icon><View /></el-icon>
                    <span>{{ t('statistics.show') || '当前显示' }}</span>
                  </div>
                </template>
                <div class="card-value">{{ statistics.show || 0 }}</div>
              </el-card>
            </el-col>
          </el-row>
          
          <el-row :gutter="20" style="margin-top: 20px;">
            <el-col :span="12">
               <el-card shadow="hover">
                 <template #header>
                   <div class="card-header">书签状态分布</div>
                 </template>
                 <div ref="chartRef" style="width: 100%; height: 350px;"></div>
               </el-card>
            </el-col>
            <el-col :span="12">
               <el-card shadow="hover">
                 <template #header>
                   <div class="card-header">统计概览</div>
                 </template>
                 <div class="summary-content">
                   <div class="summary-item">
                     <span class="summary-label">正常率:</span>
                     <span class="summary-value">{{ normalRate }}%</span>
                   </div>
                   <div class="summary-item">
                     <span class="summary-label">错误率:</span>
                     <span class="summary-value error-text">{{ errorRate }}%</span>
                   </div>
                   <div class="summary-item">
                     <span class="summary-label">待处理:</span>
                     <span class="summary-value">{{ statistics.pending || 0 }} 个</span>
                   </div>
                 </div>
               </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 批量操作页面 -->
        <div v-show="activeTab === 'batch'" class="tab-content">
          <el-row :gutter="20">
            <el-col :span="24">
              <el-card shadow="hover">
                <template #header>
                  <div class="card-header">
                    <el-icon><Operation /></el-icon>
                    <span>批量操作工具</span>
                  </div>
                </template>
                <div class="batch-operations">
                  <el-alert
                    title="提示"
                    type="info"
                    description="批量操作功能正在开发中,敬请期待..."
                    :closable="false"
                    show-icon
                    style="margin-bottom: 20px;"
                  />
                  
                  <el-row :gutter="20">
                    <el-col :span="6">
                      <el-card shadow="hover" class="operation-card">
                        <el-icon class="operation-icon" :size="48"><Delete /></el-icon>
                        <h3>批量删除</h3>
                        <p>批量删除选中的书签</p>
                        <el-button type="danger" disabled>即将推出</el-button>
                      </el-card>
                    </el-col>
                    
                    <el-col :span="6">
                      <el-card shadow="hover" class="operation-card">
                        <el-icon class="operation-icon" :size="48"><Edit /></el-icon>
                        <h3>批量修改</h3>
                        <p>批量修改书签状态</p>
                        <el-button type="primary" disabled>即将推出</el-button>
                      </el-card>
                    </el-col>
                    
                    <el-col :span="6">
                      <el-card shadow="hover" class="operation-card">
                        <el-icon class="operation-icon" :size="48"><Download /></el-icon>
                        <h3>批量导出</h3>
                        <p>导出书签数据</p>
                        <el-button type="success" disabled>即将推出</el-button>
                      </el-card>
                    </el-col>
                    
                    <el-col :span="6">
                      <el-card shadow="hover" class="operation-card">
                        <el-icon class="operation-icon" :size="48"><Link /></el-icon>
                        <h3>批量检测</h3>
                        <p>检测书签链接状态</p>
                        <el-button type="warning" disabled>即将推出</el-button>
                      </el-card>
                    </el-col>
                  </el-row>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { 
  Collection, 
  CircleCheck, 
  Compass, 
  CircleClose, 
  Hide, 
  Warning, 
  DocumentCopy, 
  View,
  DataAnalysis,
  Operation,
  Delete,
  Edit,
  Download,
  Link
} from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { onMounted, ref, watch, computed } from 'vue';
import * as echarts from 'echarts';

export default {
  name: 'DataMgr',
  components: {
    Collection,
    CircleCheck,
    Compass,
    CircleClose,
    Hide,
    Warning,
    DocumentCopy,
    View,
    DataAnalysis,
    Operation,
    Delete,
    Edit,
    Download,
    Link
  },
  props: {
    statistics: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['switch-view'],
  setup(props) {
    const { t } = useI18n();
    const chartRef = ref(null);
    const activeTab = ref('dashboard');
    let chartInstance = null;

    const normalRate = computed(() => {
      const total = props.statistics.total || 0;
      if (total === 0) return 0;
      const normal = total - (props.statistics.error || 0) - (props.statistics['404'] || 0);
      return ((normal / total) * 100).toFixed(1);
    });

    const errorRate = computed(() => {
      const total = props.statistics.total || 0;
      if (total === 0) return 0;
      const errors = (props.statistics.error || 0) + (props.statistics['404'] || 0);
      return ((errors / total) * 100).toFixed(1);
    });

    const initChart = () => {
      if (!chartRef.value) return;
      
      chartInstance = echarts.init(chartRef.value);
      
      const normal = (props.statistics.total || 0) - 
                     (props.statistics.error || 0) - 
                     (props.statistics['404'] || 0) - 
                     (props.statistics.pending || 0) -
                     (props.statistics.change || 0) -
                     (props.statistics.same || 0);
      
      const option = {
        title: {
          text: '书签状态分布',
          left: 'center',
          top: 10
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'middle'
        },
        series: [
          {
            name: '状态',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 20,
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: normal, name: '正常', itemStyle: { color: '#67C23A' } },
              { value: props.statistics.over || 0, name: '已完成', itemStyle: { color: '#409EFF' } },
              { value: props.statistics.pending || 0, name: '待处理', itemStyle: { color: '#909399' } },
              { value: props.statistics.error || 0, name: '错误', itemStyle: { color: '#F56C6C' } },
              { value: props.statistics['404'] || 0, name: '404', itemStyle: { color: '#E6A23C' } },
              { value: props.statistics.change || 0, name: '已变更', itemStyle: { color: '#F89898' } },
              { value: props.statistics.same || 0, name: '重复', itemStyle: { color: '#B3D8FF' } }
            ].filter(item => item.value > 0)
          }
        ]
      };
      chartInstance.setOption(option);
    };

    onMounted(() => {
      setTimeout(() => {
        initChart();
      }, 100);
    });
    
    watch(() => props.statistics, () => {
      if (chartInstance) {
        chartInstance.dispose();
      }
      initChart();
    }, { deep: true });

    return { t, chartRef, activeTab, normalRate, errorRate };
  }
}
</script>

<style scoped>
.data-mgr-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* Tab 导航样式 */
.mgr-tabs {
  --el-tabs-header-height: 50px;
}

:deep(.mgr-tabs .el-tabs__header) {
  margin: 0;
  border-bottom: none;
}

:deep(.mgr-tabs .el-tabs__nav-wrap) {
  padding: 0 20px;
  background: linear-gradient(to bottom, #ffffff, #f8f9fa);
}

:deep(.mgr-tabs .el-tabs__item) {
  height: 50px;
  line-height: 50px;
  font-size: 15px;
  font-weight: 500;
  color: #606266;
  transition: all 0.3s ease;
}

:deep(.mgr-tabs .el-tabs__item:hover) {
  color: #409eff;
}

:deep(.mgr-tabs .el-tabs__item.is-active) {
  color: #409eff;
  font-weight: 600;
}

:deep(.mgr-tabs .el-tabs__active-bar) {
  height: 3px;
  background: linear-gradient(to right, #409eff, #66b1ff);
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-label .el-icon {
  font-size: 18px;
}

/* Tab 内容区域 */
.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 统计卡片样式 */
.stat-card {
  text-align: center;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.card-header {
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.card-value {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
  margin-top: 10px;
}

.success-card .card-value {
  color: #67C23A;
}

.error-card .card-value {
  color: #F56C6C;
}

.warning-card .card-value {
  color: #E6A23C;
}

.info-card .card-value {
  color: #909399;
}

.change-card .card-value {
  color: #F89898;
}

.same-card .card-value {
  color: #B3D8FF;
}

.show-card .card-value {
  color: #95D475;
}

/* 统计概览样式 */
.summary-content {
  padding: 20px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #EBEEF5;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-label {
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}

.error-text {
  color: #F56C6C;
}

/* 批量操作页面样式 */
.batch-operations {
  padding: 20px;
}

.operation-card {
  text-align: center;
  padding: 30px 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.operation-card:hover {
  transform: translateY(-8px);
  border-color: #409eff;
  box-shadow: 0 8px 16px rgba(64, 158, 255, 0.2);
}

.operation-icon {
  color: #909399;
  margin-bottom: 15px;
  transition: all 0.3s ease;
}

.operation-card:hover .operation-icon {
  color: #409eff;
  transform: scale(1.1);
}

.operation-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 15px 0 10px;
}

.operation-card p {
  font-size: 14px;
  color: #909399;
  margin-bottom: 20px;
  min-height: 40px;
}

.operation-card .el-button {
  width: 100%;
  margin-top: 10px;
}
</style>
