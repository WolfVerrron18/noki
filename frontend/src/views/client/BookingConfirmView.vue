  if (errors.name || !clientPhone) return haptic.error()<template>
  <div class="stack">
    <PageHeader :title="t('booking.confirmTitle')" :back="back" />

    <NokiCard v-if="service" class="summary">
      <NokiMascot ref="noki" mood="happy" :size="72" :phone="typing" />
      <div>
        <strong>{{ service.name }}</strong>
        <p class="when">{{ fmt.dateLong(start, master.timezone) }}, {{ fmt.time(start, master.timezone) }}</p>
        <p class="hint">{{ master.name }} · {{ fmt.price(service.price) }}</p>
      </div>
    </NokiCard>

    <NokiInput v-model="name" :label="t('booking.name')" :error="errors.name" />
    <NokiPhoneInput
      v-model="phone"
      :country="country"
      telegram
      :label="t('booking.phone')"
      :placeholder="t('booking.phonePlaceholder')"
      :error="errors.phone"
    />
    <NokiTextarea v-model="note" :rows="2" :maxlength="NOTE_MAX" :label="t('booking.note')" :placeholder="t('booking.notePlaceholder')" />
    <LegalConsent v-model="consent" :action="t('booking.submit')" :consent="EnumLegalDoc.ConsentClient" :error="consentError" />

    <p v-if="errors.save" class="error">{{ errors.save }}</p>
    <NokiMainButton :text="t('booking.submit')" :loading="saving" @click="submit" />
  </div>
</template>

<script setup lang="ts">
// Подтверждение записи: имя и телефон
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NokiMascot, { type NokiMascotExpose } from '@/components/mascot/NokiMascot.vue'
import { EnumNokiPhoneAction } from '@/components/mascot/rive/character'
import NokiMainButton from '@/components/ui/NokiMainButton.vue'
import NokiCard from '@/components/ui/NokiCard.vue'
import NokiInput from '@/components/ui/NokiInput.vue'
import NokiPhoneInput from '@/components/ui/NokiPhoneInput.vue'
import NokiTextarea from '@/components/ui/NokiTextarea.vue'
import { EnumLegalDoc, NOTE_MAX } from '@/api/types'
import LegalConsent from '@/components/legal/LegalConsent.vue'
import { CLIENT_DOCS } from '@/legal/documents'
import { useLegal } from '@/stores/legal'
import PageHeader from '@/components/ui/PageHeader.vue'
import { repo } from '@/api/repo'
import { useAuth } from '@/stores/auth'
import { useBooking } from '@/stores/booking'
import { useFormat } from '@/composables/useFormat'
import { normalizePhone, phoneCountry } from '@/utils/phone'
import { haptic } from '@/telegram'

/** Пропсы BookingConfirmView */
interface Props {
  /** Адрес мастера */
  slug: string
  /** id услуги */
  serviceId: string
  /** Начало записи, ISO в UTC (из query) */
  start: string
}

const props = defineProps<Props>()
const { t } = useI18n()
const router = useRouter()
const store = useBooking()
const auth = useAuth()
const fmt = useFormat()

const master = computed(() => store.master!)
const service = computed(() => store.serviceById(props.serviceId))
/** Страна для номеров без «+»: по поясу мастера */
const country = computed(() => phoneCountry(master.value.timezone))

const name = ref(auth.me?.name === 'Preview' ? '' : auth.me?.name ?? '')
const phone = ref('')
const note = ref('')
const saving = ref(false)
const errors = reactive<{ name?: string; phone?: string; save?: string }>({})
const legal = useLegal()
/** Галочка согласия клиентки; уже давала при прошлой записи — отмечена */
const consent = ref(false)
const consentError = ref('')
legal.load().then(() => (consent.value ||= !legal.missing(CLIENT_DOCS).length)).catch(() => {})

const noki = ref<NokiMascotExpose | null>(null)
/** Клиентка начала вводить данные: Ноки достаёт телефон и тапает на каждый символ */
const typing = ref(false)
watch([name, phone, note], async () => {
  typing.value = true
  await nextTick()
  noki.value?.phone(EnumNokiPhoneAction.Tap)
})

onMounted(() => {
  if (!service.value) router.replace({ name: 'client-master', params: { slug: props.slug } })
  else if (Number.isNaN(Date.parse(props.start)) || Date.parse(props.start) <= Date.now()) back()
})

function back() {
  router.push({ name: 'client-time', params: { slug: props.slug, serviceId: props.serviceId } })
}

async function submit() {
  errors.name = name.value.trim() ? undefined : t('booking.nameRequired')
  const clientPhone = normalizePhone(phone.value, country.value)
  errors.phone = clientPhone ? undefined : t('booking.phoneInvalid')
  errors.save = undefined
  consentError.value = consent.value ? '' : t('legal.consentRequired')
  if (errors.name || !clientPhone || !consent.value) return haptic.error()

  saving.value = true
  typing.value = true
  await nextTick()
  noki.value?.phone(EnumNokiPhoneAction.Send)
  try {
    await legal.accept(CLIENT_DOCS)
  } catch (e) {
    errors.save = (e as { status?: number })?.status === 409 ? t('legal.outdated') : t('common.error')
    saving.value = false
    return haptic.error()
  }
  try {
    store.lastBooking = await repo().book({
      masterId: master.value.id,
      serviceId: props.serviceId,
      startAt: props.start,
      clientName: name.value.trim(),
      clientPhone,
      note: note.value.trim(),
    })
    haptic.success()
    router.replace({ name: 'client-done', params: { slug: props.slug } })
    // подтверждение и напоминание пришлёт бот — если клиентка разрешит ему писать
    void auth.askBotAccess()
  } catch (e) {
    errors.save = (e as { status?: number })?.status === 409 ? t('booking.slotTaken') : t('common.error')
    haptic.error()
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.summary {
  display: flex;
  align-items: center;
  gap: var(--space-md);

  p { margin: 0; }
}

.when {
  margin-top: var(--space-xs);
  color: var(--primary-600);
  font-weight: var(--font-weight-semibold);
}

.error {
  margin: 0;
  color: var(--danger-500);
  font-size: var(--font-size-sm);
}
</style>
