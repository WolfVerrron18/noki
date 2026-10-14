import { useI18n } from 'vue-i18n'
import { tg, isInTelegram, haptic } from '@/telegram'
import { appLink } from '@/utils/appLink'

const BOT = import.meta.env.VITE_BOT_USERNAME || 'nidoki_bot'
const APP = import.meta.env.VITE_APP_SHORT_NAME || 'app'

/** Ссылка на запись к мастеру и способы ей поделиться */
export function useShareLink() {
  const { t } = useI18n()

  const bookingLink = (slug: string) => appLink(BOT, APP, slug)

  async function copy(slug: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(bookingLink(slug))
      haptic.success()
      return true
    } catch {
      return false
    }
  }

  /** В Telegram — системное окно «Переслать», в браузере — Web Share API или копирование */
  async function share(slug: string): Promise<'shared' | 'copied' | 'failed'> {
    const url = bookingLink(slug)
    const text = t('master.shareText')
    if (isInTelegram()) {
      tg!.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`)
      return 'shared'
    }
    if (navigator.share) {
      try {
        await navigator.share({ url, text })
        return 'shared'
      } catch {
        // отменили — упадём в копирование
      }
    }
    return (await copy(slug)) ? 'copied' : 'failed'
  }

  return { bookingLink, copy, share }
}
