-- Схема Nidoki: пользователи, мастера, услуги, записи, отзывы.
-- Время — timestamptz (момент в UTC), показывается в поясе мастера. Деньги — целые числа в валюте мастера.

-- запрет пересечения записей одного мастера: EXCLUDE по мастеру (=) и интервалу (&&)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Кто вошёл через Telegram. И мастер, и клиентка — один и тот же пользователь
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id   bigint NOT NULL UNIQUE,
  name          text NOT NULL DEFAULT '',
  -- язык из Telegram: на нём бот пишет уведомления
  language_code text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Профиль мастера: страница записи, график, оформление
CREATE TABLE masters (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  name           text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  slug           text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9_-]{3,40}$'),
  timezone       text NOT NULL,
  -- валюта цен (ISO 4217); пока у всех рубли, поле — под мастеров из других стран и аналитику
  currency       text NOT NULL DEFAULT 'RUB',
  slot_step_min  smallint NOT NULL DEFAULT 30 CHECK (slot_step_min IN (15, 30)),
  schedule_mode  text NOT NULL DEFAULT 'weekly' CHECK (schedule_mode IN ('weekly', 'dates')),
  -- { "1": [["10:00","19:00"]], ... } — дни недели 1..7
  work_hours     jsonb NOT NULL DEFAULT '{}',
  -- { "2026-10-14": [["10:00","14:00"]] }, пустой массив — выходной
  day_overrides  jsonb NOT NULL DEFAULT '{}',
  -- [{ "id": "...", "ranges": [["10:00","19:00"]] }]
  hour_templates jsonb NOT NULL DEFAULT '[]',
  slot_mode      text NOT NULL DEFAULT 'grid' CHECK (slot_mode IN ('grid', 'fixed')),
  -- { "1": ["10:30","12:30"] }
  work_slots     jsonb NOT NULL DEFAULT '{}',
  -- { "2026-10-14": ["11:00"] }
  slot_overrides jsonb NOT NULL DEFAULT '{}',
  -- [{ "id": "...", "times": ["10:30"] }]
  slot_templates jsonb NOT NULL DEFAULT '[]',
  -- внешность Ноки: { fur, background, head, neck, badge }
  mascot         jsonb NOT NULL DEFAULT '{}',
  theme          text NOT NULL DEFAULT 'rose',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Услуги мастера. Не удаляются: на них ссылаются записи, удаление — archived
CREATE TABLE services (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id    uuid NOT NULL REFERENCES masters (id) ON DELETE CASCADE,
  name         text NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  duration_min integer NOT NULL CHECK (duration_min BETWEEN 5 AND 600),
  price        integer NOT NULL DEFAULT 0 CHECK (price >= 0),
  is_active    boolean NOT NULL DEFAULT true,
  archived     boolean NOT NULL DEFAULT false,
  description  text NOT NULL DEFAULT '' CHECK (length(description) <= 300),
  -- справочник EnumServiceCategory на фронте; текст, чтобы новые категории не требовали миграции
  category     text NOT NULL DEFAULT 'other',
  sort         integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX services_master_idx ON services (master_id, sort);

-- Записи. Услуга копируется в запись (название, цена, длительность): мастер может поменять
-- или удалить услугу, а история и выручка должны остаться такими, какими были
CREATE TABLE appointments (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id          uuid NOT NULL REFERENCES masters (id) ON DELETE CASCADE,
  service_id         uuid NOT NULL REFERENCES services (id),
  service_name       text NOT NULL,
  price              integer NOT NULL DEFAULT 0,
  currency           text NOT NULL DEFAULT 'RUB',
  duration_min       integer NOT NULL,
  client_name        text NOT NULL CHECK (length(client_name) BETWEEN 1 AND 100),
  -- E.164 («+79270576065»); пусто — мастер записала без телефона
  client_phone       text NOT NULL DEFAULT '',
  -- есть, если клиентка записалась сама через Telegram
  client_telegram_id bigint,
  note               text NOT NULL DEFAULT '' CHECK (length(note) <= 300),
  start_at           timestamptz NOT NULL,
  end_at             timestamptz NOT NULL,
  status             text NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'done')),
  -- кто отменил: для аналитики отмен
  cancelled_by       text CHECK (cancelled_by IN ('client', 'master')),
  cancelled_at       timestamptz,
  done_at            timestamptz,
  source             text NOT NULL CHECK (source IN ('client', 'manual')),
  reminder_sent      boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at),
  -- две действующие записи одного мастера не могут пересекаться — даже если два запроса пришли одновременно
  CONSTRAINT appointments_no_overlap EXCLUDE USING gist (
    master_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  ) WHERE (status = 'booked')
);
CREATE INDEX appointments_master_start_idx ON appointments (master_id, start_at);
CREATE INDEX appointments_client_idx ON appointments (client_telegram_id, start_at);

-- Идеи и ошибки от пользователей, бот пересылает их разработчику
CREATE TABLE feedback (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_telegram_id bigint NOT NULL,
  role               text NOT NULL CHECK (role IN ('master', 'client')),
  text               text NOT NULL CHECK (length(text) BETWEEN 1 AND 2000),
  created_at         timestamptz NOT NULL DEFAULT now()
);
