<template>
  <div>
    <!-- 顶部说明 -->
    <div class="mb-4">
      <h2 class="text-xl font-semibold dark:text-gray-100">全局配置</h2>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab">
      <!-- 站点设置 -->
      <el-tab-pane label="站点设置" name="site" :lazy="true">
        <el-card shadow="never" class="mt-4">
          <SiteSettings />
        </el-card>
      </el-tab-pane>

      <!-- 邮箱设置 -->
      <el-tab-pane label="邮箱设置" name="email" :lazy="true">
        <el-card shadow="never" class="mt-4">
          <EmailSettings />
        </el-card>
      </el-tab-pane>

      <!-- 安全设置 -->
      <el-tab-pane label="安全设置" name="security" :lazy="true">
        <el-card shadow="never" class="mt-4">
          <SecuritySettings />
        </el-card>
      </el-tab-pane>

      <!-- 广告设置 -->
      <el-tab-pane label="广告设置" name="ad" :lazy="true">
        <el-card shadow="never" class="mt-4">
          <AdSettings />
        </el-card>
      </el-tab-pane>

      <!-- 游戏设置 -->
      <el-tab-pane label="游戏设置" name="game" :lazy="true">
        <el-card shadow="never" class="mt-4">
          <GameSettings />
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SiteSettings from './components/SiteSettings.vue'
import EmailSettings from './components/EmailSettings.vue'
import SecuritySettings from './components/SecuritySettings.vue'
import AdSettings from './components/AdSettings.vue'
import GameSettings from './components/GameSettings.vue'

const activeTab = ref('site')
</script>
