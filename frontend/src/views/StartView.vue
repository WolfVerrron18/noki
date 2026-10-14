<template>
  <div class="stack center screen">
    <NokiMascot :mood="auth.error ? 'sad' : preview || newcomer ? 'happy' : 'thinking'" :size="160" />
    <template v-if="auth.error">
      <h2>{{ t('auth.error') }}</h2>
      <p class="hint">{{ t(auth.error) }}</p>
      <NokiButton variant="soft" @click="start">{{ t('common.retry') }}</NokiButton>
    </template>
    <template v-else-if="preview">
      <h2>{{ t('preview.title') }}</h2>
      <p class="hint">{{ t('preview.subtitle') }}</p>
      <NokiButton @click="openMaster">{{ t('preview.asMaster') }}</NokiButton>
      <NokiButton variant="soft" @click="openClient">
        {{ t('preview.asClient') }}
      </NokiButton>
    </template>
    <!-- открыли бота без ссылки мастера и своего кабинета нет: мастер пришла впервые или клиентка заглянула -->
    <template v-else-if="newcomer">
      <h2>{{ t('welcome.title') }}</h2>
      <p class="hint">{{ t('welcome.subtitle') }}</p>
      <NokiButton @click="router.push({ name: 'master-onboarding' })">{{ t('welcome.asMaster') }}</NokiButton>
      <NokiButton variant="soft" @click="router.push({ name: 'client-my' })">{{ t('welcome.myBookings') }}</NokiButton>
      <p class="hint">{{ t('welcome.clientHint') }}</p>
    </template>
    <p v-else class="hint">{{ t('common.loading') }}</p>
  </div>
</template>

<script setup lang="ts">
// Точка входа: логин и выбор ветки.
// Ссылка мастера (startapp) — страница записи; есть свой кабинет — кабинет; иначе — спрашиваем, кто пришла.
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NokiMascot from '@/components/mascot/NokiMascot.vue'
import NokiButton from '@/components/ui/NokiButton.vue'
import { useAuth } from '@/stores/auth'
import { useMaster } from '@/stores/master'
import { getStartParam, isInTelegram } from '@/telegram'
import { PREVIEW_MODE } from '@/demo'

const { t } = useI18n()
const auth = useAuth()
const router = useRouter()
const store = useMaster()
// В режиме просмотра (браузер, dev или демо) показываем выбор роли вместо автоперехода
const preview = ref(false)
/** Кабинета нет и ссылки мастера нет — показываем выбор «мастер / мои записи» */
const newcomer = ref(false)

async function start() {
  // повторная попытка после ошибки загрузки данных: вход уже есть, сбрасываем только ошибку
  auth.error = null
  await auth.login()
  if (!auth.me) return
  const slug = getStartParam()
  if (slug) return router.replace({ name: 'client-master', params: { slug } })
  if (PREVIEW_MODE && !isInTelegram()) {
    preview.value = true
    return
  }
  try {
    await store.load()
  } catch {
    auth.error = 'common.networkError'
    return
  }
  if (store.master) router.replace({ name: 'master-home' })
  else newcomer.value = true
}

function openMaster() {
  router.push({ name: 'master-home' })
}

/** Режим просмотра: страница записи к тестовому мастеру, если он уже создан */
async function openClient() {
  await store.load()
  router.push({ name: 'client-master', params: { slug: store.master?.slug ?? 'demo' } })
}

onMounted(start)
</script>

<style scoped lang="scss">
.screen {
  min-height: 80vh;
  justify-content: center;
  align-items: center;
}
</style>
