<template>
  <RouterView v-slot="{ Component }">
    <Transition name="pop" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>

<script setup lang="ts">
// Ноки текущего мастера на всех экранах; страницы клиентки переопределяют своим мастером
import { computed, provide } from 'vue'
import { NOKI_LOOK_KEY } from '@/components/mascot/look'
import { useMaster } from '@/stores/master'

const store = useMaster()
provide(NOKI_LOOK_KEY, computed(() => store.master?.mascot))
</script>

<style>
.pop-enter-active, .pop-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.pop-enter-from { opacity: 0; transform: translateY(8px); }
.pop-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
