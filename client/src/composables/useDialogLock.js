import { computed } from 'vue'

/**
 * 弹窗防关闭 composable
 *
 * 当任意 loading 状态为 true 时，阻止用户关闭弹窗。
 * 返回可直接绑定到 el-dialog 的 props 对象。
 *
 * 用法:
 *   const { dialogLockProps } = useDialogLock(() => saving.value || deleting.value)
 *   // 模板中: <el-dialog v-bind="dialogLockProps" ...>
 *
 * @param {Function} isLockedFn - 返回 boolean 的函数，true 表示锁定（不允许关闭）
 * @returns {{ dialogLockProps: ComputedRef<Object> }}
 */
export function useDialogLock(isLockedFn) {
  const dialogLockProps = computed(() => {
    const locked = isLockedFn()
    return {
      closeOnClickModal: !locked,
      closeOnPressEscape: !locked,
      showClose: !locked
    }
  })

  return { dialogLockProps }
}
