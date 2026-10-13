<template>
  <div class="stack">
    <PageHeader :title="t('booking.myTitle')" :back="canGoBack ? () => router.back() : undefined" />

    <div v-if="loading" class="stack center state">
      <NokiMascot mood="thinking" :size="110" />
    </div>

    <div v-else-if="!list.length" class="stack center state">
      <NokiMascot mood="sleepy" :size="120" />
      <p>{{ t('booking.myEmpty') }}</p>
      <p class="hint">{{ t('booking.myEmptyHint') }}</p>
    </div>

    <div v-else ref="listEl" class="stack">
      <AppointmentCard
        v-for="a in list"
        :key="a.id"
        :appointment="a"
        :timezone="a.master_timezone"
        show-date
        cancellable
        @cancel="cancel(a)"
      />
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <NokiSchemeSwitch class="scheme" />
  </div>
</template>

<script setup lang="ts">
// «Мои записи» клиентки: будущие записи ко всем мастерам, с отменой
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NokiMascot from '@/components/mascot/NokiMascot.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import NokiSchemeSwitch from '@/components/ui/NokiSchemeSwitch.vue'
import AppointmentCard from '@/components/booking/AppointmentCard.vue'
import { repo } from '@/api/repo'
import type { Appointment } from '@/api/types'
import { confirmDialog, haptic } from '@/telegram'
import { useStaggerIn } from '@/animations/useStaggerIn'

const { t } = useI18n()
const router = useRouter()

const list = ref<Appointment[]>([])
const loading = ref(true)
const error = ref('')
const listEl = ref<HTMLElement | null>(null)
useStaggerIn(listEl, loading)
const canGoBack = window.history.length > 1

async function load() {
  loading.value = true
  try {
    list.value = await repo().listMyBookings()
  } catch {
    error.value = t('common.error')
  } finally {
    loading.value = false
  }
}

async function cancel(a: Appointment) {
  if (!(await confirmDialog(t('booking.cancelConfirm')))) return
  try {
    await repo().cancelAppointment(a.id)
    list.value = list.value.filter((x) => x.id !== a.id)
    haptic.success()
  } catch {
    error.value = t('common.error')
    haptic.error()
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
.state {
  align-items: center;
  padding: var(--space-lg) 0;

  p { margin: 0; }
}

.error {
  margin: 0;
  color: var(--danger-500);
  font-size: var(--font-size-sm);
}

// настройка темы — внизу, после записей
.scheme { margin-top: var(--space-lg); }
</style>
