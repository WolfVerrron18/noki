import { defineStore } from 'pinia'
import { ref } from 'vue'
import { repo } from '@/api/repo'
import type { Master, MasterInput, Service, ServiceInput } from '@/api/types'
import { useAuth } from '@/stores/auth'
import type { NokiLook } from '@/components/mascot/look'

export const useMaster = defineStore('master', () => {
  const master = ref<Master | null>(null)
  const services = ref<Service[]>([])
  const loaded = ref(false)

  function userId() {
    const id = useAuth().me?.id
    if (!id) throw new Error('not authenticated')
    return id
  }

  async function load() {
    if (loaded.value) return
    master.value = await repo().getMyMaster(userId())
    services.value = master.value ? await repo().listServices(master.value.id) : []
    loaded.value = true
  }

  async function saveProfile(data: MasterInput) {
    master.value = master.value
      ? await repo().updateMaster(master.value.id, data)
      : await repo().createMaster(userId(), data)
  }

  /** Сохранить внешность Ноки из конструктора */
  async function saveMascot(look: NokiLook) {
    if (!master.value) throw new Error('no master')
    master.value = await repo().updateMaster(master.value.id, { mascot: look })
  }

  function isSlugFree(slug: string) {
    return repo().isSlugFree(slug, master.value?.id)
  }

  async function saveService(data: ServiceInput, id?: string) {
    if (!master.value) throw new Error('no master')
    if (id) {
      const updated = await repo().updateService(id, data)
      services.value = services.value.map((s) => (s.id === id ? updated : s))
    } else {
      services.value.push(await repo().createService(master.value.id, data))
    }
  }

  /**
   * Перенести услугу на другое место. Список меняется сразу, при ошибке — откатывается.
   * @param from текущий индекс
   * @param to новый индекс
   */
  async function moveService(from: number, to: number) {
    const before = services.value
    if (from === to || !before[from] || !before[to]) return
    const next = [...before]
    next.splice(to, 0, ...next.splice(from, 1))
    services.value = next.map((s, sort) => ({ ...s, sort }))
    try {
      await repo().reorderServices(next.map((s) => s.id))
    } catch (e) {
      services.value = before
      throw e
    }
  }

  return { master, services, load, saveProfile, saveMascot, isSlugFree, saveService, moveService }
})
