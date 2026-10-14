import { describe, expect, it } from 'vitest'
import { EnumLegalDoc } from '@/api/types'
import { CLIENT_DOCS, LEGAL_VERSIONS, MASTER_DOCS, currentVersions, isLegalDoc, missingDocs } from '@/legal/documents'

describe('missingDocs', () => {
  it('ничего не принято — нужны все', () => {
    expect(missingDocs([], MASTER_DOCS)).toEqual(MASTER_DOCS)
  })

  it('принятые в текущей версии не нужны', () => {
    expect(missingDocs(currentVersions(CLIENT_DOCS), CLIENT_DOCS)).toEqual([])
  })

  it('старая версия — документ нужен снова', () => {
    const old = [...currentVersions([EnumLegalDoc.Privacy, EnumLegalDoc.ConsentMaster]), { document: EnumLegalDoc.Terms, version: '2000-01-01' }]
    expect(missingDocs(old, MASTER_DOCS)).toEqual([EnumLegalDoc.Terms])
  })

  it('согласие клиентки не заменяет согласие мастера', () => {
    expect(missingDocs(currentVersions(CLIENT_DOCS), MASTER_DOCS)).toEqual([EnumLegalDoc.ConsentMaster])
  })
})

describe('isLegalDoc', () => {
  it('знает только свои документы', () => {
    expect(isLegalDoc('terms')).toBe(true)
    expect(isLegalDoc('cookies')).toBe(false)
    expect(Object.keys(LEGAL_VERSIONS).every(isLegalDoc)).toBe(true)
  })
})
