import { ref, watch, type Ref } from 'vue'
import { repo } from '@/api/repo'
import type { Master, Service } from '@/api/types'

/**
 * Свободные слоты на выбранный день; перезагружаются при смене мастера, услуги или дня.
 * @param master мастер
 * @param service услуга
 * @param date день "YYYY-MM-DD" в поясе мастера
 * @param manual слоты для ручной записи мастером
 */
export function useSlots(
  master: Ref<Master | null | undefined>,
  service: Ref<Service | null | undefined>,
  date: Ref<string>,
  manual = false,
) {
  /** Начала свободных слотов, ISO в UTC */
  const slots = ref<string[]>([])
  /** Идёт загрузка */
  const loading = ref(false)
  /** Не удалось загрузить */
  const failed = ref(false)

  let request = 0

  async function reload() {
    const m = master.value
    const s = service.value
    if (!m || !s) {
      slots.value = []
      return
    }
    const current = ++request
    loading.value = true
    failed.value = false
    try {
      const res = await repo().getFreeSlots(m.id, s.id, date.value, manual)
      if (current === request) slots.value = res
    } catch {
      if (current === request) {
        slots.value = []
        failed.value = true
      }
    } finally {
      if (current === request) loading.value = false
    }
  }

  watch([() => master.value?.id, () => service.value?.id, date], reload, { immediate: true })

  return { slots, loading, failed, reload }
}
