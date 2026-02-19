<template>
  <div class="default-layout">
    <header class="layout-header">
      <slot name="header">
        <h1>WikimoeGuild</h1>
      </slot>
    </header>
    <main class="layout-main">
      <slot />
    </main>
    <footer class="layout-footer">
      <slot name="footer">
        <p>&copy; 2026 WikimoeGuild</p>
      </slot>
    </footer>
  </div>
</template>

<script setup>
// 默认布局
</script>

<style scoped>
.default-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.layout-header {
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.layout-main {
  flex: 1;
  padding: 24px;
}

.layout-footer {
  padding: 16px 24px;
  text-align: center;
  color: #999;
  font-size: 12px;
}
</style>
