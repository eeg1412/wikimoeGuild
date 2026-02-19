<template>
  <div class="home">
    <h1>WikimoeGuild</h1>
    <p>欢迎来到首页</p>
    <router-link to="/login">去登录</router-link>
  </div>
</template>

<script setup>
// 首页
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 16px;
}
</style>
