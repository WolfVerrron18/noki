import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { repo } from '@/api/repo'
import type { Appointment, Master, Service } from '@/api/types'

const LAST_KEY = 'nidoki.lastBooking'

/** Последняя запись из sessionStorage или null */
function readLast(): Appointment | null {
  try {
    const raw = sessionStorage.getItem(LAST_KEY)
    return raw ? (JSON.parse(raw) as Appointment) : null
  } catch {
    return null
  }
}

/** Запись клиентки: мастер по ссылке, его услуги и последняя созданная запись */
export const useBooking = defineStore('booking', () => {
  /** Мастер, к которому записываемся; null — не найден */
  const master = ref<Master | null>(null)
  /** Видимые услуги мастера */
  const services = ref<Service[]>([])
  /** Для какого адреса загружены данные */
  const slug = ref<string | null>(null)
  /** Только что созданная запись — для экрана «Готово». Живёт в sessionStorage: перезагрузка экрана её не теряет */
  const lastBooking = ref<Appointment | null>(readLast())

  watch(lastBooking, (v) => {
    try {
      if (v) sessionStorage.setItem(LAST_KEY, JSON.stringify(v))
      else sessionStorage.removeItem(LAST_KEY)
    } catch {
      // нет доступа к хранилищу — после перезагрузки «Готово» просто вернёт на страницу мастера
    }
  })

  /**
   * Загрузить мастера и услуги по адресу ссылки (повторно для того же адреса не грузит).
   * @param value адрес из startapp
   */
  async function load(value: string) {
    if (slug.value === value) return
    master.value = await repo().getMasterBySlug(value)
    services.value = master.value ? await repo().listActiveServices(master.value.id) : []
    slug.value = value
  }

  /**
   * Услуга по id среди загруженных.
   * @param id id услуги
   */
  function serviceById(id: string): Service | undefined {
    return services.value.find((s) => s.id === id)
  }

  return { master, services, slug, lastBooking, load, serviceById }
})
