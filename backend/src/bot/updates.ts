// Сообщения пользователей боту. Пока одна команда — /start: приветствие и кнопки в мини-апп.
// /start <адрес мастера> (ссылка t.me/<бот>?start=<адрес>) — сразу кнопка записи к этому мастеру.
import { eq } from 'drizzle-orm'
import { EnumStartParam, appLink } from '@/utils/appLink'
import type { Db } from '~/db/client'
import { masters, users } from '~/db/schema'
import type { Bot } from '~/bot/api'
import { botLang, bt } from '~/bot/i18n'
import type { AppLinks } from '~/bot/messages'

/** Часть Update из Bot API, которую мы читаем */
export interface TelegramUpdate {
  /** id обновления: для опроса getUpdates */
  update_id: number
  /** Сообщение в личке */
  message?: {
    /** Текст */
    text?: string
    /** Отправитель */
    from?: {
      /** Telegram id */
      id: number
      /** Имя */
      first_name?: string
      /** Фамилия */
      last_name?: string
      /** Язык интерфейса Telegram */
      language_code?: string
      /** Бот ли это */
      is_bot?: boolean
    }
  }
}

/**
 * Обработать обновление от Telegram.
 * @param update обновление
 * @param deps база, бот, ссылки на мини-апп
 */
export async function handleUpdate(update: TelegramUpdate, deps: { db: Db; bot: Bot; links: AppLinks }): Promise<void> {
  const msg = update.message
  const from = msg?.from
  if (!msg?.text || !from || from.is_bot) return
  const [command, payload] = msg.text.trim().split(/\s+/, 2)
  if (command !== '/start') return

  // написал боту — значит, бот может ему отвечать и присылать уведомления
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ').slice(0, 100)
  const languageCode = (from.language_code ?? '').slice(0, 10)
  await deps.db
    .insert(users)
    .values({ telegramId: from.id, name, languageCode, writeAccess: true })
    .onConflictDoUpdate({ target: users.telegramId, set: { writeAccess: true, languageCode } })

  const lang = botLang(from.language_code)
  const { bot, app } = deps.links
  const [master] = payload ? await deps.db.select().from(masters).where(eq(masters.slug, payload)) : []
  if (master) {
    await deps.bot.send(from.id, {
      title: bt(lang, 'startMaster.text', { master: master.name }),
      buttons: [{ text: bt(lang, 'startMaster.book'), url: appLink(bot, app, master.slug) }],
    })
    return
  }
  await deps.bot.send(from.id, {
    title: bt(lang, 'start.title'),
    lines: [bt(lang, 'start.text')],
    buttons: [
      { text: bt(lang, 'start.open'), url: appLink(bot, app) },
      { text: bt(lang, 'start.my'), url: appLink(bot, app, EnumStartParam.My) },
    ],
  })
}
