import { defineStore } from 'pinia'
import { ref } from 'vue'
import { repo } from '@/api/repo'
import type { Appointment, Master, Service } from '@/api/types'

/** Запись клиентки: мастер по ссылке, его услуги и последняя созданная запись */
export const useBooking = defineStore('booking', () => {
  /** Мастер, к которому записываемся; null — не найден */
  const master = ref<Master | null>(null)
  /** Видимые услуги мастера */
  const services = ref<Service[]>([])
  /** Для какого адреса загружены данные */
  const slug = ref<string | null>(null)
  /** Только что созданная запись — для экрана «Готово» */
  const lastBooking = ref<Appointment | null>(null)

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
