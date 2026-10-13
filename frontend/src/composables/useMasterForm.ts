// Форма профиля мастера: общая для онбординга, экрана «Профиль» и экрана «Часы работы».
// Каждый экран показывает свою часть полей, сохраняется всегда весь профиль.
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { EnumScheduleMode, WEEKDAYS, type MasterInput, type Weekday } from '@/api/types'
import { DEFAULT_LOOK } from '@/components/mascot/look'
import { useAuth } from '@/stores/auth'
import { useMaster } from '@/stores/master'
import { useShareLink } from '@/composables/useShareLink'
import { slugify, sanitizeSlug, SLUG_RE } from '@/utils/slug'
import { deviceTimezone } from '@/utils/time'
import { fromRanges, validateDayHours } from '@/utils/hours'
import { todayIn } from '@/utils/slots'

/** Ошибки формы — уже переведённые тексты */
export interface MasterFormErrors {
  /** Имя */
  name?: string
  /** Адрес ссылки */
  slug?: string
  /** Часы работы */
  hours?: string
  /** Сохранение */
  save?: string
}

/** Часы по умолчанию для нового мастера: будни 10–19 */
const DEFAULT_WORK_HOURS: MasterInput['work_hours'] = {
  1: [['10:00', '19:00']],
  2: [['10:00', '19:00']],
  3: [['10:00', '19:00']],
  4: [['10:00', '19:00']],
  5: [['10:00', '19:00']],
}

/** Состояние и действия формы профиля мастера */
export function useMasterForm() {
  const { t } = useI18n()
  const auth = useAuth()
  const store = useMaster()
  const { bookingLink } = useShareLink()

  const existing = store.master
  /** Поля профиля; заполнены текущим профилем, если он есть */
  const form = reactive<MasterInput>({
    name: existing?.name ?? (auth.me?.name === 'Preview' ? '' : auth.me?.name ?? ''),
    slug: existing?.slug ?? '',
    timezone: existing?.timezone ?? deviceTimezone(),
    slot_step_min: existing?.slot_step_min ?? 30,
    mascot: existing?.mascot ?? { ...DEFAULT_LOOK },
    schedule_mode: existing?.schedule_mode ?? EnumScheduleMode.Weekly,
    work_hours: existing?.work_hours ?? DEFAULT_WORK_HOURS,
    day_overrides: existing?.day_overrides ?? {},
    hour_templates: existing?.hour_templates ?? [],
  })
  const errors = reactive<MasterFormErrors>({})
  /** Дни недели с ошибкой в часах — редактор подсвечивает их */
  const invalidDays = ref<Weekday[]>([])
  /** Календарь «по датам»: сколько дней выбрано */
  const selectedDays = ref(0)
  /** Календарь «по датам»: открыта ли шторка часов (у неё своя главная кнопка) */
  const sheetOpen = ref(false)
  /** Выбор дней в календаре идёт прямо сейчас — главная кнопка становится «Задать часы · N» */
  const pickingDays = computed(() => form.schedule_mode === EnumScheduleMode.Dates && selectedDays.value > 0)
  const saving = ref(false)

  // Пока адрес не трогали руками — он следует за именем
  const slugTouched = ref(!!existing)
  watch(() => form.name, (name) => {
    if (!slugTouched.value) form.slug = slugify(name)
  })

  /**
   * Ввод адреса ссылки: дальше он не следует за именем.
   * @param v введённое значение
   */
  function onSlugInput(v: string | number | undefined) {
    slugTouched.value = true
    form.slug = sanitizeSlug(String(v ?? ''))
  }

  /** Подсказка под адресом: итоговая ссылка, а не технический параметр */
  const slugHint = computed(() =>
    SLUG_RE.test(form.slug)
      ? t('onboarding.profile.slugPreview', { link: bookingLink(form.slug).replace('https://', '') })
      : t('onboarding.profile.slugHint'),
  )

  /** Есть ли ошибка — Ноки грустит */
  const hasError = computed(() => !!(errors.name || errors.slug || errors.hours || errors.save))

  /**
   * Проверить имя и адрес (адрес — и на занятость).
   * @returns всё ли в порядке; при сбое сети пишет errors.save
   */
  async function validateProfile(): Promise<boolean> {
    errors.save = undefined
    errors.name = form.name.trim() ? undefined : t('onboarding.profile.nameRequired')
    errors.slug = SLUG_RE.test(form.slug) ? undefined : t('onboarding.profile.slugInvalid')
    if (errors.name || errors.slug) return false
    try {
      if (!(await store.isSlugFree(form.slug))) errors.slug = t('onboarding.profile.slugTaken')
    } catch {
      errors.save = t('common.error')
      return false
    }
    return !errors.slug
  }

  /**
   * Проверить часы работы.
   * @returns всё ли в порядке
   */
  function validateHours(): boolean {
    if (form.schedule_mode === EnumScheduleMode.Dates) {
      // часы каждой даты проверяет календарь при применении; здесь — что есть хоть один будущий рабочий день
      const today = todayIn(form.timezone)
      const hasFuture = Object.entries(form.day_overrides).some(([date, r]) => date >= today && r?.length)
      errors.hours = hasFuture ? undefined : t('scheduleEditor.empty')
      return !errors.hours
    }
    const days = WEEKDAYS.filter((d) => form.work_hours[d]?.length)
    const problems = days.map((d) => [d, validateDayHours(fromRanges(form.work_hours[d])!)] as const).filter(([, e]) => e)
    invalidDays.value = problems.map(([d]) => d)
    errors.hours = !days.length ? t('onboarding.hours.empty') : problems.length ? t(problems[0][1]!) : undefined
    return !errors.hours
  }

  /**
   * Сохранить профиль целиком.
   * @returns удалось ли
   */
  async function save(): Promise<boolean> {
    errors.save = undefined
    saving.value = true
    try {
      await store.saveProfile({
        ...form,
        name: form.name.trim(),
        // в недельном режиме отметки на даты — исключения из шаблона; экрана для них пока нет,
        // поэтому даты, оставшиеся от режима «по датам», не должны молча перекрывать шаблон
        day_overrides: form.schedule_mode === EnumScheduleMode.Weekly ? {} : form.day_overrides,
      })
      return true
    } catch {
      errors.save = t('common.error')
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    form,
    errors,
    invalidDays,
    selectedDays,
    sheetOpen,
    pickingDays,
    saving,
    slugHint,
    hasError,
    onSlugInput,
    validateProfile,
    validateHours,
    save,
  }
}

/** Форма профиля мастера — то, что возвращает useMasterForm */
export type MasterForm = ReturnType<typeof useMasterForm>
