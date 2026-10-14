-- Принятые документы: соглашение, политика, согласия на обработку ПДн. Нужны, чтобы доказать согласие:
-- кто, какой документ, в какой редакции и когда принял. Новая редакция — новая строка, старые не удаляются.
CREATE TABLE consents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  -- EnumLegalDoc на фронте: terms, privacy, consent-master, consent-client
  document    text NOT NULL,
  -- редакция документа (дата), LEGAL_VERSIONS
  version     text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, document, version)
);
