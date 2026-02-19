<template>
  <el-container class="admin-layout">
    <!-- 移动端遮罩 -->
    <div
      v-if="isMobile && sidebarOpen"
      class="sidebar-overlay"
      @click="sidebarOpen = false"
    />

    <!-- 侧边栏 -->
    <el-aside
      :width="sidebarWidth"
      class="admin-aside"
      :class="{ 'is-mobile': isMobile, 'is-open': sidebarOpen }"
    >
      <div class="sidebar">
        <!-- Logo -->
        <div class="sidebar-logo">
          <span
            v-show="!isCollapsed || isMobile"
            class="text-lg font-bold text-white truncate"
          >
            WikimoeGuild
          </span>
          <span
            v-show="isCollapsed && !isMobile"
            class="text-lg font-bold text-white"
            >W</span
          >
        </div>
        <!-- 菜单 -->
        <el-scrollbar class="flex-1">
          <el-menu
            :default-active="route.path"
            :collapse="isCollapsed && !isMobile"
            background-color="#304156"
            text-color="#bfcbd9"
            active-text-color="#409eff"
            router
            :collapse-transition="false"
            class="sidebar-menu"
            @select="handleMenuSelect"
          >
            <el-menu-item
              v-for="item in adminMenu"
              :key="item.path"
              :index="item.path"
            >
              <el-icon>
                <component :is="item.icon" />
              </el-icon>
              <template #title>{{ item.title }}</template>
            </el-menu-item>
          </el-menu>
        </el-scrollbar>
      </div>
    </el-aside>

    <!-- 右侧主体 -->
    <el-container class="flex flex-col flex-1 min-w-0">
      <!-- 顶栏 -->
      <el-header class="admin-header">
        <div class="flex items-center gap-3">
          <el-icon
            class="cursor-pointer text-xl header-icon"
            @click="toggleSidebar"
          >
            <component
              :is="isMobile ? 'Menu' : isCollapsed ? 'Expand' : 'Fold'"
            />
          </el-icon>
          <el-breadcrumb separator="/" class="hidden sm:flex">
            <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">
              首页
            </el-breadcrumb-item>
            <el-breadcrumb-item
              v-if="route.meta.title && route.name !== 'AdminDashboard'"
            >
              {{ route.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
          <span class="sm:hidden text-sm font-medium header-text">
            {{ route.meta.title || '仪表盘' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <!-- 暗模式切换 -->
          <el-button text circle @click="toggleTheme" class="header-icon-btn">
            <el-icon :size="18">
              <Moon v-if="!isDark" />
              <Sunny v-else />
            </el-icon>
          </el-button>
          <span class="text-sm header-text hidden sm:inline">
            {{ adminStore.user?.username || '管理员' }}
          </span>
          <el-button type="danger" text size="small" @click="handleLogout">
            退出
          </el-button>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '../stores/admin.js'
import { adminMenu } from '../config/adminMenu.js'
import { useIsMobile } from '../composables/useIsMobile.js'
import { useTheme } from '../composables/useTheme.js'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const { isMobile } = useIsMobile()
const { isDark, toggleTheme } = useTheme()

const isCollapsed = ref(false)
const sidebarOpen = ref(false)

const sidebarWidth = computed(() => {
  if (isMobile.value) return '220px'
  return isCollapsed.value ? '64px' : '220px'
})

function toggleSidebar() {
  if (isMobile.value) {
    sidebarOpen.value = !sidebarOpen.value
  } else {
    isCollapsed.value = !isCollapsed.value
  }
}

function handleMenuSelect() {
  // 移动端选菜单后自动关闭侧边栏
  if (isMobile.value) {
    sidebarOpen.value = false
  }
}

// 切换到桌面端时关闭抽屉
watch(isMobile, val => {
  if (!val) sidebarOpen.value = false
})

onMounted(async () => {
  if (adminStore.token && !adminStore.user) {
    try {
      await adminStore.fetchProfile()
    } catch {
      adminStore.logout()
      router.push('/admin/login')
    }
  }
})

function handleLogout() {
  adminStore.logout()
  router.push('/admin/login')
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

/* ── 侧边栏 ── */
.admin-aside {
  transition: width 0.3s;
  overflow: hidden;
  flex-shrink: 0;
}

.admin-aside.is-mobile {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 1001;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.admin-aside.is-mobile.is-open {
  transform: translateX(0);
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #304156;
}

.sidebar-logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar-menu {
  border-right: none !important;
}

/* ── 顶栏 ── */
.admin-header {
  height: 56px !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 16px;
  z-index: 10;
}

:global(.dark) .admin-header {
  background: #1d1e1f;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.header-icon {
  color: #606266;
}

:global(.dark) .header-icon {
  color: #a3a6ad;
}

.header-icon-btn {
  color: #606266 !important;
}

:global(.dark) .header-icon-btn {
  color: #a3a6ad !important;
}

.header-text {
  color: #606266;
}

:global(.dark) .header-text {
  color: #a3a6ad;
}

/* ── 内容区 ── */
.admin-main {
  background: #f0f2f5;
  padding: 16px;
  overflow: auto;
}

:global(.dark) .admin-main {
  background: #141414;
}

/* ── 移动端间距调整 ── */
@media (max-width: 768px) {
  .admin-header {
    padding: 0 12px;
  }

  .admin-main {
    padding: 12px;
  }
}
</style>
