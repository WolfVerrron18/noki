<template>
  <div class="stack">
    <PageHeader :title="t('schedule.newTitle')" :back="back" />

    <div v-if="!services.length" class="stack center state">
      <NokiMascot mood="sleepy" :size="110" />
      <p>{{ t('schedule.noServices') }}</p>
      <NokiButton variant="soft" @click="router.push({ name: 'master-service-new' })">{{ t('services.add') }}</NokiButton>
    </div>

    <template v-else>
      <NokiSelect v-model="serviceId" :label="t('schedule.service')" :options="serviceOptions" />

      <DateStrip v-model="date" :timezone="master.timezone" :schedule="master" :count="30" />

      <div v-if="loading" class="stack center state">
        <NokiMascot :size="96" />
      </div>
      <p v-else-if="!slots.length" class="hint center">{{ t('booking.noSlots') }}</p>
      <SlotGrid v-else v-model="start" :slots="slots" :timezone="master.timezone" />

      <NokiInput v-model="clientName" :label="t('schedule.clientName')" :error="errors.name" />
      <NokiInput
        v-model="clientPhone"
        type="tel"
        inputmode="tel"
        :label="t('schedule.clientPhone')"
        :placeholder="t('booking.phonePlaceholder')"
        :hint="t('schedule.phoneOptional')"
        :error="errors.phone"
      />

      <p v-if="errors.save" class="error">{{ errors.save }}</p>
      <NokiMainButton :text="t('schedule.save')" :loading="saving" :disabled="!start" @click="save" />
    </template>
  </div>
</template>

<script setup lang="ts">
// Мастер добавляет запись вручную (клиентка позвонила или написала)
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NokiMascot from '@/components/mascot/NokiMascot.vue'
import NokiButton from '@/components/ui/NokiButton.vue'
import NokiMainButton from '@/components/ui/NokiMainButton.vue'
import NokiInput from '@/components/ui/NokiInput.vue'
import NokiSelect from '@/components/ui/NokiSelect.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import DateStrip from '@/components/booking/DateStrip.vue'
import SlotGrid from '@/components/booking/SlotGrid.vue'
import { repo } from '@/api/repo'
import { useMaster } from '@/stores/master'
import { useFormat } from '@/composables/useFormat'
import { useSlots } from '@/composables/useSlots'
import { isValidPhone } from '@/utils/phone'
import { todayIn } from '@/utils/slots'
import { haptic } from '@/telegram'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useMaster()
const fmt = useFormat()

const master = computed(() => store.master!)
const services = computed(() => store.services.filter((s) => s.is_active))
const serviceOptions = computed(() =>
  services.value.map((s) => ({ value: s.id, label: `${s.name} · ${fmt.duration(s.duration_min)}` })),
)

const serviceId = ref(services.value[0]?.id ?? '')
const service = computed(() => services.value.find((s) => s.id === serviceId.value))
const today = todayIn(master.value.timezone)
const requested = typeof route.query.date === 'string' ? route.query.date : today
// в прошлое записывать нельзя — полоска дат начинается с сегодня
const date = ref(requested < today ? today : requested)
const start = ref<string | null>(null)
const clientName = ref('')
const clientPhone = ref('')
const saving = ref(false)
const errors = reactive<{ name?: string; phone?: string; save?: string }>({})

const { slots, loading, reload } = useSlots(master, service, date, true)
watch([date, serviceId], () => (start.value = null))

function back() {
  router.push({ name: 'master-schedule', query: { date: date.value } })
}

async function save() {
  errors.name = clientName.value.trim() ? undefined : t('booking.nameRequired')
  errors.phone = !clientPhone.value.trim() || isValidPhone(clientPhone.value) ? undefined : t('booking.phoneInvalid')
  errors.save = undefined
  if (errors.name || errors.phone || !start.value) return haptic.error()

  saving.value = true
  try {
    await repo().addManualAppointment({
      masterId: master.value.id,
      serviceId: serviceId.value,
      startAt: start.value,
      clientName: clientName.value.trim(),
      clientPhone: clientPhone.value.trim(),
    })
    haptic.success()
    back()
  } catch (e) {
    const taken = (e as { status?: number })?.status === 409
    errors.save = taken ? t('booking.slotTaken') : t('common.error')
    if (taken) reload()
    haptic.error()
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.state {
  align-items: center;
  padding: var(--space-md) 0;

  p { margin: 0; }
}

.error {
  margin: 0;
  color: var(--danger-500);
  font-size: var(--font-size-sm);
}
</style>
