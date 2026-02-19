import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * 响应式移动端检测
 * @param {number} breakpoint 断点宽度，默认 768
 */
export function useIsMobile(breakpoint = 768) {
  const isMobile = ref(false)
  let mql = null

  function update(e) {
    isMobile.value = !e.matches
  }

  onMounted(() => {
    mql = window.matchMedia(`(min-width: ${breakpoint}px)`)
    isMobile.value = !mql.matches
    mql.addEventListener('change', update)
  })

  onBeforeUnmount(() => {
    if (mql) mql.removeEventListener('change', update)
  })

  return { isMobile }
}
