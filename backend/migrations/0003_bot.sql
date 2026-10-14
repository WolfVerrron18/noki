-- Можно ли боту писать пользователю: Telegram пускает сообщения бота, только если человек нажал /start
-- или разрешил это в мини-аппе (requestWriteAccess, allows_write_to_pm в initData)
ALTER TABLE users ADD COLUMN write_access boolean NOT NULL DEFAULT false;
