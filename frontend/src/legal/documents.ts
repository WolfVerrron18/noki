// Юридические документы: версии и кто что принимает. Общий модуль фронта и сервера (backend импортирует его).
// Текст документа поменялся — поднимаем версию: мастера увидят документ снова, клиентки — при следующей записи.
import { EnumLegalDoc, type AcceptedDoc } from '@/api/types'

/** Текущие версии документов (дата редакции) */
export const LEGAL_VERSIONS: Record<EnumLegalDoc, string> = {
  [EnumLegalDoc.Terms]: '2026-10-14',
  [EnumLegalDoc.Privacy]: '2026-10-14',
  [EnumLegalDoc.ConsentMaster]: '2026-10-14',
  [EnumLegalDoc.ConsentClient]: '2026-10-14',
}

/** Что принимает мастер при создании страницы */
export const MASTER_DOCS: EnumLegalDoc[] = [EnumLegalDoc.Terms, EnumLegalDoc.Privacy, EnumLegalDoc.ConsentMaster]

/** Что принимает клиентка при записи */
export const CLIENT_DOCS: EnumLegalDoc[] = [EnumLegalDoc.Terms, EnumLegalDoc.Privacy, EnumLegalDoc.ConsentClient]

/** Все документы в порядке показа */
export const LEGAL_DOCS: EnumLegalDoc[] = Object.values(EnumLegalDoc)

/**
 * Какие документы из нужных ещё не приняты в текущей версии.
 * @param accepted принятые документы
 * @param required нужные документы
 */
export function missingDocs(accepted: AcceptedDoc[], required: EnumLegalDoc[]): EnumLegalDoc[] {
  return required.filter((d) => !accepted.some((a) => a.document === d && a.version === LEGAL_VERSIONS[d]))
}

/**
 * Текущие версии документов — для отправки на сервер.
 * @param docs документы
 */
export function currentVersions(docs: EnumLegalDoc[]): AcceptedDoc[] {
  return docs.map((document) => ({ document, version: LEGAL_VERSIONS[document] }))
}

/**
 * Документ ли это сервиса (параметр адреса, тело запроса).
 * @param v значение
 */
export function isLegalDoc(v: unknown): v is EnumLegalDoc {
  return LEGAL_DOCS.includes(v as EnumLegalDoc)
}
