import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

/**
 * 弹窗路由查询管理 composable
 *
 * 弹窗打开时向 URL 写入 ?dlg=key，关闭或浏览器后退时清除
 * 页面刷新/首次进入时不会自动打开弹窗（清除 stale query）
 *
 * 用法:
 *   const { visible: myDialog } = useDialogRoute('myDialog')
 *   // 模板中: <el-dialog v-model="myDialog">
 *   // 打开: myDialog = true
 *   // 关闭: myDialog = false（或 el-dialog 自动设置）
 *
 * @param {string} dialogKey - 弹窗标识符
 * @param {Object} options
 * @param {Function} options.onBack - 用户按浏览器后退时的额外回调
 * @returns {{ visible: Ref<boolean> }}
 */
export function useDialogRoute(dialogKey, options = {}) {
  const router = useRouter()
  const route = useRoute()
  const visible = ref(false)

  let skipNextWatch = false
  let hasPushed = false

  // 监听 visible 变化（处理代码设置和 el-dialog v-model 的关闭）
  watch(visible, val => {
    if (skipNextWatch) {
      skipNextWatch = false
      return
    }
    if (val) {
      // 弹窗打开 → 推送历史记录
      hasPushed = true
      router.push({
        query: { ...route.query, dlg: dialogKey }
      })
    } else if (hasPushed) {
      // 弹窗关闭 → 后退到没有 dlg 的状态
      hasPushed = false
      router.back()
    }
  })

  // 监听浏览器后退按钮
  function handlePopState() {
    if (visible.value && hasPushed) {
      // 检查当前 URL 是否仍包含此弹窗的 key
      const params = new URLSearchParams(window.location.search)
      if (params.get('dlg') !== dialogKey) {
        hasPushed = false
        skipNextWatch = true
        visible.value = false
        if (options.onBack) options.onBack()
      }
    }
  }

  onMounted(() => {
    window.addEventListener('popstate', handlePopState)
    // 页面刷新/首次进入时清除 stale 的 dlg 参数（不是玩家主动操作生成的）
    if (route.query.dlg === dialogKey) {
      const newQuery = { ...route.query }
      delete newQuery.dlg
      router.replace({ query: newQuery })
    }
  })

  onUnmounted(() => {
    window.removeEventListener('popstate', handlePopState)
  })

  return { visible }
}
