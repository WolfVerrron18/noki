// Есть ли несохранённые изменения: «Сохранить» неактивна, пока форма совпадает с сохранённой,
// а уход с экрана с изменениями спрашивает подтверждение.
import { computed, ref, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { confirmDialog } from '@/telegram'

/** Состояние «форма изменена» */
export interface Dirty {
  /** Форма отличается от сохранённой */
  dirty: Readonly<Ref<boolean>>
  /** Запомнить текущее состояние как сохранённое (после успешного сохранения) */
  markSaved: () => void
  /**
   * Можно ли уйти с экрана: без изменений — сразу да, иначе спрашивает.
   * @returns true — уходим
   */
  confirmLeave: () => Promise<boolean>
}

/**
 * Следить за изменениями формы.
 * @param snapshot возвращает всё, что сохраняет главная кнопка (сравнивается через JSON)
 * @returns состояние и действия
 */
export function useDirty(snapshot: () => unknown): Dirty {
  const { t } = useI18n()
  const saved = ref(JSON.stringify(snapshot()))
  const dirty = computed(() => JSON.stringify(snapshot()) !== saved.value)

  function markSaved() {
    saved.value = JSON.stringify(snapshot())
  }

  async function confirmLeave(): Promise<boolean> {
    return !dirty.value || confirmDialog(t('common.leaveUnsaved'))
  }

  return { dirty, markSaved, confirmLeave }
}
