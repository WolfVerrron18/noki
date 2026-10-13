<template>
  <div class="stack center screen">
    <NokiMascot :mood="auth.error ? 'sad' : preview ? 'happy' : 'thinking'" :size="160" />
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
    <p v-else class="hint">{{ t('common.loading') }}</p>
  </div>
</template>

<script setup lang="ts">
// Точка входа: логин и выбор ветки «клиентка / мастер»
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NokiMascot from '@/components/mascot/NokiMascot.vue'
import NokiButton from '@/components/ui/NokiButton.vue'
import { useAuth } from '@/stores/auth'
import { useMaster } from '@/stores/master'
import { getStartParam, isInTelegram } from '@/telegram'

const { t } = useI18n()
const auth = useAuth()
const router = useRouter()
// В браузере при разработке показываем выбор роли вместо автоперехода
const preview = ref(false)

async function start() {
  // повторная попытка после ошибки загрузки данных: вход уже есть, сбрасываем только ошибку
  auth.error = null
  await auth.login()
  if (!auth.me) return
  const slug = getStartParam()
  if (slug) return router.replace({ name: 'client-master', params: { slug } })
  if (import.meta.env.DEV && !isInTelegram()) {
    preview.value = true
    return
  }
  // guard роутера сам отправит в онбординг, если профиля мастера ещё нет
  router.replace({ name: 'master-home' })
}

function openMaster() {
  router.push({ name: 'master-home' })
}

/** Режим просмотра: страница записи к тестовому мастеру, если он уже создан */
async function openClient() {
  const store = useMaster()
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
