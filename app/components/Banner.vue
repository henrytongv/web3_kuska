<template>
  <div class="banner">{{ $t('banner') }}</div>
</template>

<script setup>
</script>

<style scoped>
.banner {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: #ffd400;
  color: #1a1a1a;
  border-top: 3px solid #ff2d78;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-align: center;
  padding: 6px 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
