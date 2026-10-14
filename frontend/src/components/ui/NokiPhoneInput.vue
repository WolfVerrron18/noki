<template>
  <div ref="root" class="phone" @paste="onPaste">
    <NokiInput
      v-model="text"
      type="tel"
      inputmode="tel"
      :prefix="`+${parts.code}`"
      :label="label"
      :hint="hint"
      :error="error"
      :placeholder="placeholder"
    />
    <button v-if="fromTelegram" type="button" class="from-tg" @click="takeFromTelegram">{{ t('phone.fromTelegram') }}</button>
  </div>
</template>

<script setup lang="ts">
// Поле телефона: код страны («+7») стоит слева всегда, в поле — только номер с маской.
// Вставка в любом виде («8 927…», «7927…», «+7 (927)…», «8-(927)-…») раскладывается на код и номер.
// Модель — номер целиком в показанном виде; проверка и приведение к E.164 — normalizePhone() при отправке.
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CountryCode } from 'libphonenumber-js/min'
import NokiInput from '@/components/ui/NokiInput.vue'
import { formatNational, joinPhone, splitPhone, type PhoneParts } from '@/utils/phone'
import { canRequestPhone, haptic, requestPhone } from '@/telegram'

/** Пропсы NokiPhoneInput */
interface Props {
  /** Страна для номеров без «+» (см. phoneCountry): её код стоит перед полем */
  country: CountryCode
  /** Подпись над полем */
  label?: string
  /** Подсказка под полем, скрывается при ошибке */
  hint?: string
  /** Текст ошибки: подсвечивает поле красным */
  error?: string
  /** Текст-пример в пустом поле: номер без кода страны */
  placeholder?: string
  /** Показать кнопку «Взять из Telegram»: только когда номер вводят о себе */
  telegram?: boolean
}

const props = defineProps<Props>()
/** Номер целиком в показанном виде, например «+7 900 123 45 67»; пусто — не введён */
const model = defineModel<string>({ default: '' })
const { t } = useI18n()

const root = ref<HTMLElement | null>(null)
const fromTelegram = props.telegram && canRequestPhone()

/** Код и номер; модель пересобирается из них */
const parts = ref<PhoneParts>(splitPhone(model.value, props.country))

// номер поменяли снаружи (сброс формы, «Взять из Telegram») — разбираем заново
watch(model, (v) => {
  if (v !== joinPhone(parts.value)) parts.value = splitPhone(v, props.country)
})

/** Столько цифр и больше во вставке — это номер целиком */
const FULL_NUMBER_DIGITS = 10

const digits = (v: string) => v.replace(/\D/g, '')

/** Вставили номер целиком — он заменяет набранное, а не дописывается к нему */
function onPaste(e: ClipboardEvent) {
  const pasted = e.clipboardData?.getData('text') ?? ''
  if (digits(pasted).length < FULL_NUMBER_DIGITS) return
  e.preventDefault()
  parts.value = splitPhone(pasted, props.country)
  model.value = joinPhone(parts.value)
  syncInput()
}

const text = computed({
  get: () => formatNational(parts.value),
  set(raw) {
    let value = String(raw ?? '')
    const shown = formatNational(parts.value)
    // стёрли только пробел или дефис — стираем и цифру перед ним, иначе маска вернёт символ обратно
    if (value.length < shown.length && digits(value) === digits(shown)) value = digits(value).slice(0, -1)
    // вставленный целиком номер («8 927…», «+7 927…») разбираем как есть;
    // если перед полем чужой код (вставили «+380…»), правка цифр его не сбрасывает
    const foreign = parts.value.code !== splitPhone('', props.country).code
    const keepCode = foreign && !value.trim().startsWith('+') && digits(value)
    parts.value = splitPhone(keepCode ? `+${parts.value.code}${digits(value)}` : value, props.country)
    model.value = joinPhone(parts.value)
    syncInput()
  },
})

/** Если маска вернула то же значение, Vue не перерисует поле — выравниваем текст в поле сами */
async function syncInput() {
  await nextTick()
  const input = root.value?.querySelector('input')
  const shown = formatNational(parts.value)
  if (input && input.value !== shown) input.value = shown
}

async function takeFromTelegram() {
  haptic.tap()
  const phone = await requestPhone()
  if (!phone) return
  parts.value = splitPhone(phone.startsWith('+') ? phone : `+${phone}`, props.country)
  model.value = joinPhone(parts.value)
}
</script>

<style scoped lang="scss">
.phone {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);

  // код страны — часть номера: тем же шрифтом, с отступом до цифр
  :deep(.prefix) {
    margin-right: var(--space-xs);
    color: var(--text);
    font-weight: var(--font-weight-semibold);
  }
}

.from-tg {
  align-self: flex-end;
  padding: var(--space-xs) 0;
  border: 0;
  background: none;
  color: var(--secondary-on-soft);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
</style>
