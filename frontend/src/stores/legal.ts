import { defineStore } from 'pinia'
import { ref } from 'vue'
import { repo } from '@/api/repo'
import type { AcceptedDoc, EnumLegalDoc } from '@/api/types'
import { currentVersions, missingDocs } from '@/legal/documents'

// Принятые пользователем документы: загружаются один раз после входа, обновляются при приёме
export const useLegal = defineStore('legal', () => {
  const accepted = ref<AcceptedDoc[]>([])
  const loaded = ref(false)

  /** Загрузить принятые документы (один раз за сессию) */
  async function load() {
    if (loaded.value) return
    accepted.value = await repo().acceptedDocuments()
    loaded.value = true
  }

  /**
   * Какие из нужных документов ещё не приняты в текущей редакции.
   * @param required нужные документы
   */
  function missing(required: EnumLegalDoc[]): EnumLegalDoc[] {
    return missingDocs(accepted.value, required)
  }

  /**
   * Принять документы в текущей редакции. Уже принятые не отправляются.
   * @param docs документы
   */
  async function accept(docs: EnumLegalDoc[]) {
    const todo = missing(docs)
    if (todo.length) accepted.value = await repo().acceptDocuments(currentVersions(todo))
  }

  return { accepted, loaded, load, missing, accept }
})
