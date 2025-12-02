<template>
  <div class="data-mgr-container">
    <el-container direction="vertical" style="height: 100vh; background-color: var(--el-bg-color);">
      <el-header height="50px" style="display: flex; align-items: center; border-bottom: 1px solid var(--el-border-color);">
      <el-button @click="$emit('switch-view')" circle>
        <el-icon><Back /></el-icon>
      </el-button>
      <span style="margin-left: 10px; font-size: 18px; font-weight: bold;">{{ t('dashboard.title') || 'Dashboard' }}</span>
    </el-header>
    
    <el-main>
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

    </el-main>
    </el-container>
  </div>
</template>

<script>
import { 
  Back, 
  Collection, 
  CircleCheck, 
  Compass, 
  CircleClose, 
  Hide, 
  Warning, 
  DocumentCopy, 
  View 
} from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { onMounted, ref, watch, computed } from 'vue';
import * as echarts from 'echarts';

export default {
  name: 'DataMgr',
  components: {
    Back,
    Collection,
    CircleCheck,
    Compass,
    CircleClose,
    Hide,
    Warning,
    DocumentCopy,
    View
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

    return { t, chartRef, normalRate, errorRate };
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
</style>
