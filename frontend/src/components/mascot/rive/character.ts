// Контракт ViewModel `Character` из Rive-файла персонажа (public/rive/*.riv).
// Значения enum'ов совпадают с ключами enum'ов в Rive — не переименовываем без правки файла.

import type { NokiMood } from '@/components/mascot/NokiMascot.vue'

/** Головной убор — enum `Hat` в Rive */
export enum EnumNokiHat {
  None = 'none',
  OrigamiBoat = 'origamiBoat',
  OrigamiCrown = 'origamiCrown',
  OrigamiTulip = 'origamiTulip',
  Bow = 'bow',
  Beret = 'beret',
  Beanie = 'beanie',
  FlowerCrown = 'flowerCrown',
  PartyHat = 'partyHat',
  WitchHat = 'witchHat',
  BunnyEars = 'bunnyEars',
  Sprout = 'sprout',
  Halo = 'halo',
  TopHat = 'topHat',
}

/** Все головные уборы в порядке показа */
export const NOKI_HATS: EnumNokiHat[] = Object.values(EnumNokiHat)

/**
 * Короткая реакция — триггер в Rive. Играет один раз поверх настроения и плавно возвращает в него:
 * - cheer — ура (запись создана, сохранено)
 * - wave — привет (первое появление)
 * - oops — ой (ошибка, перед грустью)
 * - nod — кивок (выбрала слот или услугу)
 * - love — сердечко (ссылка скопирована)
 * - admire — любуется нарядом (конструктор)
 */
export enum EnumNokiReaction {
  Cheer = 'cheer',
  Wave = 'wave',
  Oops = 'oops',
  Nod = 'nod',
  Love = 'love',
  Admire = 'admire',
}

/** Действие с телефоном — триггер в Rive. Работает, пока включён проп phone */
export enum EnumNokiPhoneAction {
  /** Тап по экрану: на каждый ввод символа */
  Tap = 'phoneTap',
  /** Отправка: из телефона вылетает сообщение */
  Send = 'phoneSend',
  /** Готово: показывает галочку на экране и убирает телефон */
  Done = 'phoneDone',
}

/** Настроения Ноки в порядке показа (enum `Mood` в Rive) */
export const NOKI_MOODS: NokiMood[] = ['happy', 'wink', 'sleepy', 'thinking', 'sad']

/** Описание Rive-файла персонажа */
export interface RiveCharacterSource {
  /** Адрес .riv-файла */
  src: string
  /** Имя артборда */
  artboard: string
  /** Имя state machine */
  stateMachine: string
}

/** Ноки: файл лежит в public/rive */
export const NOKI_RIVE: RiveCharacterSource = {
  // от базового пути сборки: на GitHub Pages сайт живёт не в корне домена
  src: `${import.meta.env.BASE_URL}rive/noki_rebuilt.riv`,
  artboard: 'Noki',
  stateMachine: 'Noki',
}
