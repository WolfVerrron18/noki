# Nidoki — состояние проекта

Рабочая памятка для продолжения работы (для Claude и для себя). Правила кода — в `CLAUDE.md`, здесь — что сделано, что нет и где подводные камни.
Обновлять в конце каждого этапа. Последнее обновление: 2026-10-14, коммит `03bf3e2`.

## Кратко

- **Фронтенд**: функционально готов, работает целиком на `mockRepo` (localStorage) в `npm run dev`.
- **Бэкенд**: есть только вход (`POST /api/tg-auth`) и миграции. Все эндпоинты записи — нет.
- **Бот, деплой**: не начаты.
- Проверки: `cd frontend && npx vue-tsc --noEmit && npm test && npm run build` — всё зелёное (34 теста).

## Сделано (по коммитам, от старых к новым)

| Коммит | Что |
|---|---|
| `c4ea7dd` | Начальный снимок (git заведён в этой сессии) |
| `84a13d5` | SVG-маскот удалён, Ноки только Rive; конструктор = шапки Rive (`components/mascot/registry.ts`) |
| `021c30b` | Перерывы: `suggestPause` всегда верный, сортировка, перенос через соседний (`setPauseEdge`), vitest |
| `f0d71fa` | Телефон: `NokiPhoneInput` + libphonenumber-js, E.164, «Взять из Telegram» |
| `c9d44dd` | Типовые услуги по категории (`services/presets.ts`), чипы в форме новой услуги |
| `eeaabf0` | Режим «точное время»: `slot_mode`, `work_slots`, `slot_overrides`, `slot_templates`, `startsFor()` |
| `0a1ad6b` | Цветовые темы мастера (`masters.theme`, `$palettes`, `data-palette`), экран «Оформление» |
| `7ba5537` | Иконки категорий: брови, маникюр, депиляция, макияж |
| `ac39fea` | Тур (`useTour` + `NokiTour`), первый тур — главная мастера |
| `13ec07a` | Плавный `NokiSwitch`, свой `NokiSelect` (шторка), `NokiNumberInput` |
| `f52bc14` | Удаление услуги (мягкое, `archived`), «Такой услуги нет», «Готово» в sessionStorage, роли в проде (экран «Я мастер / Мои записи»), плашка «это твоя страница» |
| `a95c1b6` | Заметка к записи (`appointments.note`), карточка записи с цветной шапкой, полоска «сменить роль» в режиме просмотра |
| `a8eb1c0` | Ручной выбор светлой/тёмной темы (`NokiSchemeSwitch`), `secondary = primary`, плотнее подложки |
| `dbdb5cf` | Нейтральные тона берут оттенок primary целиком (тёмное «Небо» было зелёным), «Небо» = `#3f8ae6` |
| `03bf3e2` | «Отменить» / «Удалить» — `NokiButton variant="outline"` цветом темы |

Фидбек первой тестировщицы (7 пунктов) закрыт полностью.

## Осталось — по порядку

### Этап 3. Бэкенд (Pocketbase JS-хуки, `backend/pb_hooks/`)
Фронт уже вызывает эти адреса из `frontend/src/api/pbRepo.ts`; `mockRepo.ts` — эталон поведения (409, проверки отмены/«выполнено»).
1. `lib/slots.js` — порт `freeSlots` / `rangesFor` / `startsFor` / `isWorkDay` из `frontend/src/utils/slots.ts` один в один (обе ветки: grid и fixed). Общие тест-кейсы (JSON), чтобы фронт и бэк не разошлись.
2. `GET /api/nidoki/slots?master&service&date[&manual=1]` — busy из `appointments` со `status=booked`; `manual=1` только владельцу, без `MIN_LEAD_MIN` и фильтра окон.
3. `POST /api/nidoki/book` — тело `BookingInput` (camelCase: masterId, serviceId, startAt, clientName, clientPhone, note). Проверки: услуга активна и не `archived`; начало ∈ `freeSlots()` с теми же настройками; телефон → E.164; `note` ≤ 300; `client_telegram_id` из auth; 409 при конфликте. Записать `service_name` в запись (сейчас имя берётся из expand и пропадает, если услугу скрыли).
4. `POST /api/nidoki/appointments` (ручная запись мастера), `POST .../:id/cancel` (клиентка — свою, мастер — свою, только пока не началась), `POST .../:id/done` (только мастер, только после начала).
5. `POST /api/nidoki/feedback` + пересылка разработчику в Telegram.
6. Валидация JSON-полей мастера в `onRecordCreate/Update` (`work_hours`, `day_overrides`, `hour_templates`, `work_slots`, `slot_overrides`, `slot_templates`, `mascot`, `theme`).
7. Атомарный `reorderServices` (сейчас N параллельных update).
8. Миграции уже лежат и ещё ни разу не применялись к живой базе: `1760100000`…`1760400000` — прогнать на локальном Pocketbase.

### Этап 4. Бот
- `sendMessage` в `lib/telegram.js`, словари `pb_hooks/i18n/{ru,en}.js`, язык из `language_code` (сохранять в `users`).
- Уведомления: мастеру — новая запись / отмена (с заметкой), клиентке — подтверждение / отмена.
- `cronAdd` — напоминание клиентке (поле `reminder_sent` уже есть).
- `/start`, кнопка меню с мини-аппом.

### Этап 5. Деплой
- `deploy/nginx/nidoki.conf` (статика + proxy `/api` → 8090, существующий сертификат), `deploy/systemd/pocketbase.service`, скрипт сборки/выкладки, раздел в README.
- README не содержит брифа и плана, хотя CLAUDE.md ссылается — поправить.

### Отложено / обсудить с Кириллом
- Валюта мастера (`CURRENCY='RUB'` захардкожена в `useFormat.ts`).
- Ноки в пузыре тура; одежда/фоны/цвет шёрстки в Rive (конструктор пока только шапки, Ноки всегда розовый).
- Туры для других экранов (часы, расписание) и для клиентки; тур через несколько экранов.
- Редактирование заметки после создания записи.
- Чем ещё мастер может выделиться: фото, «о себе», контакты/адрес, портфолио.
- Своя кнопка «назад» и в Telegram (сейчас там только системная BackButton).
- Прошлые записи / история у клиентки.

## Подводные камни (уже наступали)

- **Корень экрана — один элемент, комментарий только внутри.** Комментарий перед корнем делает фрагмент → `<Transition mode="out-in">` в `App.vue` зависает, следующий экран пустой.
- **Panel браузера скрыта**: анимации и переходы идут только во время скриншота. Пустой экран сразу после перехода — сначала сделать 1–2 скриншота, потом искать баг. Проверить по-настоящему: `requestAnimationFrame` и `document.visibilityState`.
- **Perl `s|…|…|` в bash**: `|` внутри шаблона ломает замену (испортил `stores/booking.ts`). Использовать `s#…#…#` или Edit/Write.
- **sed с `\$a` в i18n** вставил буквальный `$a`. После правок локалей сверять структуру: `diff <(grep -oE "^ +[a-zA-Z0-9]+:" ru.ts) <(… en.ts)`.
- **Scoped-стили родителя действуют на корень дочернего компонента**: класс `.times` в `WorkHoursEditor` растянул корень `DaySlotsForm`. Корням давать уникальные имена классов.
- **HMR после правки шаблона и скрипта одновременно** иногда оставляет страницу в сломанном состоянии (ложные «Failed to resolve component»). Делать полную перезагрузку (`navigate`).
- Удалять файлы через `rm` песочница не даёт без git; теперь git есть — `git rm`.
- vue-scroll-picker: клик по варианту не выбирает его, только прокрутка колёсиком/перетаскивание.

## Где что лежит (быстрый указатель)

- Палитра и темы: `frontend/src/styles/_palette.scss` (`$palettes`, `tinted-neutral`), `_theme.scss`, `styles/palettes.ts`.
- Светлая/тёмная: `frontend/src/telegram/index.ts` (`applyTheme`, `setColorSchemePref`).
- Расчёт слотов: `frontend/src/utils/slots.ts` (+ `slots.test.ts`); часы — `utils/hours.ts`; точное время — `utils/daySlots.ts`.
- Данные: `api/types.ts` (`normalizeSchedule`, `NOTE_MAX`), `api/repo.ts`, `pbRepo.ts`, `mockRepo.ts`.
- Тестовые данные мока: localStorage `nidoki.mock.v1` (мастер `anya_test`, услуги, несколько записей с 14–16 октября).
