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
            <template
              v-for="item in filteredMenu"
              :key="item.path || item.title"
            >
              <!-- 有子菜单 -->
              <el-sub-menu
                v-if="item.children && item.children.length"
                :index="item.title"
              >
                <template #title>
                  <el-icon><component :is="item.icon" /></el-icon>
                  <span>{{ item.title }}</span>
                </template>
                <el-menu-item
                  v-for="child in item.children"
                  :key="child.path"
                  :index="child.path"
                >
                  <el-icon><component :is="child.icon" /></el-icon>
                  <template #title>{{ child.title }}</template>
                </el-menu-item>
              </el-sub-menu>
              <!-- 普通菜单项 -->
              <el-menu-item v-else :index="item.path">
                <el-icon>
                  <component :is="item.icon" />
                </el-icon>
                <template #title>{{ item.title }}</template>
              </el-menu-item>
            </template>
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
              v-for="crumb in breadcrumbs"
              :key="crumb.title"
              :to="crumb.path ? { path: crumb.path } : undefined"
            >
              {{ crumb.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>

          <!-- 手机端：有父级层级时使用 Popover，否则纯文字 -->
          <div class="sm:hidden">
            <el-popover
              v-if="breadcrumbs.length > 1"
              trigger="click"
              placement="bottom-start"
              :width="180"
            >
              <template #reference>
                <span
                  class="text-sm font-medium header-text cursor-pointer flex items-center gap-1"
                >
                  {{ currentPageTitle || '仪表盘' }}
                  <el-icon :size="11"><ArrowDown /></el-icon>
                </span>
              </template>
              <div class="flex flex-col gap-1">
                <p class="text-xs text-gray-400 mb-1">页面层级</p>
                <span
                  class="text-sm text-[var(--el-color-primary)] cursor-pointer hover:opacity-80"
                  @click="router.push('/admin/dashboard')"
                  >首页</span
                >
                <template v-for="crumb in breadcrumbs" :key="crumb.title">
                  <span
                    v-if="crumb.path"
                    class="text-sm text-[var(--el-color-primary)] cursor-pointer hover:opacity-80"
                    @click="router.push(crumb.path)"
                    >{{ crumb.title }}</span
                  >
                  <span
                    v-else
                    class="text-sm text-gray-600 dark:text-gray-300"
                    >{{ crumb.title }}</span
                  >
                </template>
              </div>
            </el-popover>
            <span v-else class="text-sm font-medium header-text">
              {{ currentPageTitle || '仪表盘' }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <!-- 暗模式切换 -->
          <el-button text circle @click="toggleTheme" class="header-icon-btn">
            <el-icon :size="18">
              <Moon v-if="!isDark" />
              <Sunny v-else />
            </el-icon>
          </el-button>
          <!-- 用户信息 + 修改密码 -->
          <el-dropdown trigger="click">
            <span
              class="flex items-center gap-1 cursor-pointer text-sm header-text"
            >
              {{ adminStore.user?.username || '管理员' }}
              <el-icon :size="12"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleChangePassword">
                  <el-icon><Lock /></el-icon> 修改密码
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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

/**
 * 当前页面标题：支持 dynamicTitle（新增/编辑区分）
 */
const currentPageTitle = computed(() => {
  if (route.meta?.dynamicTitle) {
    return route.query.mode === 'edit'
      ? route.meta.title
      : route.meta.createTitle || route.meta.title
  }
  return route.meta?.title || ''
})

/**
 * 面包屑列表（不含首页，首页固定在模板中）
 * 每项：{ title, path? }，最后一项 path 为空表示当前页
 */
const breadcrumbs = computed(() => {
  if (route.name === 'AdminDashboard') return []
  const crumbs = []
  const parent = route.meta?.breadcrumbParent
  if (parent) {
    crumbs.push({ title: parent.title, path: parent.path })
  }
  const title = currentPageTitle.value
  if (title) {
    crumbs.push({ title })
  }
  return crumbs
})

/** 根据当前登录管理员的 role 过滤菜单 */
const filteredMenu = computed(() => {
  const role = adminStore.user?.role
  return adminMenu.filter(item => {
    if (item.requiredRole === undefined) return true
    return role === item.requiredRole
  })
})

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

function handleChangePassword() {
  router.push({ name: 'AdminChangePassword' })
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
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-lighter);
  padding: 0 16px;
  z-index: 10;
}

.header-icon {
  color: var(--el-text-color-regular);
}

.header-icon-btn {
  color: var(--el-text-color-regular) !important;
}

.header-text {
  color: var(--el-text-color-regular);
}

/* ── 内容区 ── */
.admin-main {
  background: var(--el-bg-color-page);
  padding: 16px;
  overflow: auto;
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
