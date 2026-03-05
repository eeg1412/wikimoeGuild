import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

/**
 * 弹窗路由查询管理 composable（支持多重弹窗）
 *
 * 弹窗打开时向 URL 写入 ?dlg=key；多个弹窗同时打开时以逗号分隔堆叠记录，
 * 例如 ?dlg=dialogA,dialogB。
 * 关闭或浏览器后退时自动还原。
 *
 * 用法:
 *   const { visible: myDialog } = useDialogRoute('myDialog')
 *   // 模板中: <el-dialog v-model="myDialog">
 *   // 打开: myDialog.value = true
 *   // 关闭: myDialog.value = false（或 el-dialog 自动设置）
 *
 * @param {string} dialogKey - 弹窗标识符，需在当前页面唯一
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

  /** 获取当前 URL 中的弹窗堆栈（顺序数组） */
  function getStack() {
    const dlg = route.query.dlg
    if (!dlg) return []
    const arr = Array.isArray(dlg) ? dlg : [dlg]
    return arr.flatMap(d => d.split(',')).filter(Boolean)
  }

  /** 从堆栈构造 query 对象（空堆栈时删除 dlg 字段） */
  function buildQuery(stack) {
    const newQuery = { ...route.query }
    if (stack.length > 0) {
      newQuery.dlg = stack.join(',')
    } else {
      delete newQuery.dlg
    }
    return newQuery
  }

  // 监听 visible 变化（处理代码设置和 el-dialog v-model 的关闭）
  watch(visible, val => {
    if (skipNextWatch) {
      skipNextWatch = false
      return
    }
    if (val) {
      // 弹窗打开 → 追加到堆栈末尾并推入历史
      hasPushed = true
      const stack = getStack()
      if (!stack.includes(dialogKey)) stack.push(dialogKey)
      router.push({ query: buildQuery(stack) })
    } else if (hasPushed) {
      // 弹窗关闭（代码触发）→ 后退一步（恢复到打开此弹窗之前的历史状态）
      hasPushed = false
      router.back()
    }
  })

  // 监听浏览器后退按钮
  function handlePopState() {
    if (visible.value && hasPushed) {
      const params = new URLSearchParams(window.location.search)
      const dlgParam = params.get('dlg') || ''
      const currentStack = dlgParam.split(',').filter(Boolean)
      if (!currentStack.includes(dialogKey)) {
        hasPushed = false
        skipNextWatch = true
        visible.value = false
        if (options.onBack) options.onBack()
      }
    }
  }

  onMounted(() => {
    window.addEventListener('popstate', handlePopState)
    // 页面刷新/首次进入时清除 stale 的 dlg 参数（非玩家主动操作生成的）
    const stack = getStack()
    if (stack.includes(dialogKey)) {
      const newStack = stack.filter(k => k !== dialogKey)
      router.replace({ query: buildQuery(newStack) })
    }
  })

  onUnmounted(() => {
    window.removeEventListener('popstate', handlePopState)
  })

  return { visible }
}
