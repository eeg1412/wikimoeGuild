<template>
  <div>
    <h2 class="text-xl font-semibold mb-4 dark:text-gray-100">仪表盘</h2>
    <el-row :gutter="16">
      <el-col :xs="24" :sm="8" class="mb-4 sm:mb-0">
        <el-card shadow="hover">
          <div class="flex items-center gap-4">
            <el-icon class="text-4xl text-blue-500"><User /></el-icon>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                欢迎回来
              </div>
              <div class="text-lg font-bold dark:text-gray-100">
                {{ adminStore.user?.username || '管理员' }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8" class="mb-4 sm:mb-0">
        <el-card shadow="hover">
          <div class="flex items-center gap-4">
            <el-icon class="text-4xl text-green-500"><Calendar /></el-icon>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                今日日期
              </div>
              <div class="text-lg font-bold dark:text-gray-100">
                {{ today }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="flex items-center gap-4">
            <el-icon class="text-4xl text-orange-500"><Bell /></el-icon>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                系统状态
              </div>
              <div class="text-lg font-bold text-green-600">正常</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAdminStore } from '../../stores/admin.js'
import { formatDate } from '@shared'

const adminStore = useAdminStore()
const today = computed(() => formatDate(new Date(), 'YYYY-MM-DD'))
</script>
