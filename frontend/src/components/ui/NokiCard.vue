<template>
  <div class="card"><slot /></div>
</template>

<style scoped lang="scss">
.card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  box-shadow: var(--shadow);
}
</style>
