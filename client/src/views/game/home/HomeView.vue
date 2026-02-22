<template>
  <div>
    <div class="text-center">
      <el-icon class="text-6xl text-blue-500 mb-6"><Promotion /></el-icon>
      <h2 class="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        欢迎来到 WikimoeGuild
      </h2>
      <p class="text-gray-500 dark:text-gray-400 mb-8 text-lg">
        一个优雅的内容管理系统
      </p>
      <div class="flex gap-4 justify-center">
        <el-button type="primary" size="large" @click="$router.push('/login')">
          开始使用
        </el-button>
        <el-button size="large" @click="$router.push('/admin/login')">
          管理后台
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup></script>
