<template>
  <div v-if="state === 'loading'" class="stack center state">
    <NokiMascot mood="thinking" />
    <p class="hint">{{ t('common.loading') }}</p>
  </div>

  <div v-else-if="state === 'error'" class="stack center state">
    <NokiMascot mood="sad" />
    <h2>{{ t('auth.error') }}</h2>
    <p class="hint">{{ t('common.networkError') }}</p>
    <NokiButton variant="soft" @click="load(slug)">{{ t('common.retry') }}</NokiButton>
  </div>

  <div v-else-if="state === 'notFound'" class="stack center state">
    <NokiMascot mood="sad" />
    <h2>{{ t('client.notFound') }}</h2>
    <p class="hint">{{ t('client.notFoundHint') }}</p>
  </div>

  <RouterView v-else />
</template>

<script setup lang="ts">
// Обёртка страниц записи: грузит мастера по адресу ссылки и показывает его Ноки на всех вложенных экранах
import { computed, provide, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import NokiMascot from '@/components/mascot/NokiMascot.vue'
import NokiButton from '@/components/ui/NokiButton.vue'
import { NOKI_LOOK_KEY } from '@/components/mascot/look'
import { useBooking } from '@/stores/booking'
import { useMaster } from '@/stores/master'

/** Пропсы BookingLayout */
interface Props {
  /** Адрес мастера из ссылки (startapp) */
  slug: string
}

/** Состояние загрузки: «не найден» и «не удалось загрузить» показываем по-разному */
type State = 'loading' | 'ready' | 'notFound' | 'error'

const props = defineProps<Props>()
const { t } = useI18n()
const store = useBooking()
const own = useMaster()
const state = ref<State>('loading')

provide(NOKI_LOOK_KEY, computed(() => store.master?.mascot))

/**
 * Загрузить мастера по адресу.
 * @param slug адрес из ссылки
 */
async function load(slug: string) {
  state.value = 'loading'
  try {
    // свой кабинет тоже: если мастер открыла свою же ссылку, страница это покажет. Ошибка тут не мешает записи
    await Promise.all([store.load(slug), own.load().catch(() => undefined)])
    state.value = store.master ? 'ready' : 'notFound'
  } catch {
    state.value = 'error'
  }
}

watch(() => props.slug, load, { immediate: true })
</script>

<style scoped lang="scss">
.state {
  min-height: 70vh;
  justify-content: center;
  align-items: center;

  h2, p { margin: 0; }
}
</style>
