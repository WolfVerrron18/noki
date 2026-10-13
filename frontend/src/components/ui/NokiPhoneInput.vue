<template>
  <div ref="root" class="phone">
    <NokiInput v-model="text" type="tel" inputmode="tel" :label="label" :hint="hint" :error="error" :placeholder="placeholder" />
    <button v-if="fromTelegram" type="button" class="from-tg" @click="takeFromTelegram">{{ t('phone.fromTelegram') }}</button>
  </div>
</template>

<script setup lang="ts">
// Поле телефона с маской по мере ввода. Модель — номер в том виде, как он показан;
// проверка и приведение к E.164 — normalizePhone() при отправке формы.
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CountryCode } from 'libphonenumber-js/min'
import NokiInput from '@/components/ui/NokiInput.vue'
import { formatPhoneInput } from '@/utils/phone'
import { canRequestPhone, haptic, requestPhone } from '@/telegram'

/** Пропсы NokiPhoneInput */
interface Props {
  /** Страна для номеров без «+» (см. phoneCountry) */
  country: CountryCode
  /** Подпись над полем */
  label?: string
  /** Подсказка под полем, скрывается при ошибке */
  hint?: string
  /** Текст ошибки: подсвечивает поле красным */
  error?: string
  /** Текст-пример в пустом поле */
  placeholder?: string
  /** Показать кнопку «Взять из Telegram»: только когда номер вводят о себе */
  telegram?: boolean
}

const props = defineProps<Props>()
/** Номер в показанном виде, например «+7 900 123 45 67» */
const model = defineModel<string>({ default: '' })
const { t } = useI18n()

const root = ref<HTMLElement | null>(null)
const fromTelegram = props.telegram && canRequestPhone()

const digits = (v: string) => v.replace(/\D/g, '')

const text = computed({
  get: () => model.value,
  set(raw) {
    let value = String(raw ?? '')
    // стёрли только скобку, пробел или дефис — стираем и цифру перед ним, иначе маска вернёт символ обратно
    if (value.length < model.value.length && digits(value) === digits(model.value)) {
      const d = digits(value)
      value = (value.trim().startsWith('+') ? '+' : '') + d.slice(0, -1)
    }
    model.value = formatPhoneInput(value, props.country)
    syncInput()
  },
})

/** Если маска вернула то же значение, Vue не перерисует поле — выравниваем текст в поле сами */
async function syncInput() {
  await nextTick()
  const input = root.value?.querySelector('input')
  if (input && input.value !== model.value) input.value = model.value
}

async function takeFromTelegram() {
  haptic.tap()
  const phone = await requestPhone()
  if (phone) model.value = formatPhoneInput(phone, props.country)
}
</script>

<style scoped lang="scss">
.phone {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
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
