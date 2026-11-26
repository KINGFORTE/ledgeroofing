CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS staff_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'editor', 'staff')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_email BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS can_manage_email BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  replaced_by UUID REFERENCES refresh_tokens(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_hash_idx ON refresh_tokens(token_hash);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ledgeroofing_app') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON refresh_tokens TO ledgeroofing_app';
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('project', 'blog')),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  cover_image TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  author_id UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (type, slug)
);

CREATE INDEX IF NOT EXISTS content_items_public_idx ON content_items(type, status, published_at DESC);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('channel', 'dm')),
  name TEXT,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS conversations_channel_name_idx
  ON conversations(name) WHERE type = 'channel';

CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  body TEXT NOT NULL DEFAULT '',
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  CHECK (length(body) <= 10000)
);

CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_reactions (
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id, emoji)
);

INSERT INTO conversations (type, name, is_private)
SELECT 'channel', 'general', FALSE
WHERE NOT EXISTS (SELECT 1 FROM conversations WHERE type = 'channel' AND name = 'general');

CREATE TABLE IF NOT EXISTS team_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (length(body) BETWEEN 1 AND 5000)
);

CREATE INDEX IF NOT EXISTS team_notes_created_idx ON team_notes(created_at DESC);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'approval_requested', 'done')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  due_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES staff_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
DECLARE c_name text;
BEGIN
  SELECT conname INTO c_name
  FROM pg_constraint
  WHERE conrelid = 'tasks'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%status%';
  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE tasks DROP CONSTRAINT %I', c_name);
  END IF;
END $$;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('todo', 'in_progress', 'approval_requested', 'done'));

CREATE INDEX IF NOT EXISTS tasks_assigned_idx ON tasks(assigned_to, status, due_at);
CREATE INDEX IF NOT EXISTS tasks_created_idx ON tasks(created_by, created_at DESC);

CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS task_comments_task_idx ON task_comments(task_id, created_at);

CREATE TABLE IF NOT EXISTS task_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE INDEX IF NOT EXISTS task_time_entries_task_idx ON task_time_entries(task_id);
CREATE INDEX IF NOT EXISTS task_time_entries_user_idx ON task_time_entries(user_id, ended_at);
CREATE UNIQUE INDEX IF NOT EXISTS task_time_entries_one_running_idx ON task_time_entries(user_id) WHERE ended_at IS NULL;

CREATE TABLE IF NOT EXISTS task_deadline_reminders (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  quarter SMALLINT NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, quarter)
);

CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled')),
  created_by UUID NOT NULL REFERENCES staff_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS meetings_start_idx ON meetings(starts_at, status);

CREATE TABLE IF NOT EXISTS meeting_members (
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'attendee' CHECK (role IN ('host', 'attendee')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  PRIMARY KEY (meeting_id, user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  href TEXT NOT NULL DEFAULT '/staff',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_key TEXT,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  sender_id UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL
);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS event_key TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES staff_users(id) ON DELETE SET NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message_id UUID REFERENCES messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_event_key_idx ON notifications(user_id, event_key) WHERE event_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS notifications_conversation_idx ON notifications(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_sender_idx ON notifications(sender_id);

-- Legacy message alerts predate event keys; give them stable keys so future
-- deduplication never collapses unrelated historical alerts.
UPDATE notifications SET event_key = 'legacy:' || id::text WHERE event_key IS NULL;

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions(user_id);

CREATE TABLE IF NOT EXISTS push_tokens (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'android',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_tokens_user_idx ON push_tokens(user_id);

ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '';
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE TABLE IF NOT EXISTS attendance_days (
  user_id UUID NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS attendance_days_date_idx ON attendance_days(attendance_date DESC);

ALTER TABLE meetings ADD COLUMN IF NOT EXISTS guest_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT '',
  entity_id TEXT NOT NULL DEFAULT '',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON audit_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON audit_log (entity_type, entity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS drawing_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  service TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drawing_submission_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES drawing_submissions(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT '',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS drawing_submission_files_submission_idx ON drawing_submission_files (submission_id, created_at DESC);
CREATE INDEX IF NOT EXISTS drawing_submissions_created_idx ON drawing_submissions (created_at DESC);

CREATE TABLE IF NOT EXISTS drawing_submission_assignments (
  submission_id UUID NOT NULL REFERENCES drawing_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (submission_id, user_id)
);
CREATE INDEX IF NOT EXISTS drawing_assignments_user_idx ON drawing_submission_assignments (user_id, submission_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ledgeroofing_app') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON drawing_submission_assignments TO ledgeroofing_app';
  END IF;
END
$$;

-- Employee workspace profile fields. These extend staff_users rather than
-- duplicating identity, auth, or availability data in a second table.
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS preferred_name TEXT NOT NULL DEFAULT '';
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS job_title TEXT NOT NULL DEFAULT '';
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT '';
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS employment_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'available';
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS work_phone TEXT NOT NULL DEFAULT '';
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS office_location TEXT NOT NULL DEFAULT '';
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS working_hours TEXT NOT NULL DEFAULT '';
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS preferred_contact TEXT NOT NULL DEFAULT 'message';
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS skills TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS qualifications TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS languages TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS interests TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS experience TEXT[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_users_employment_status_check') THEN
    ALTER TABLE staff_users ADD CONSTRAINT staff_users_employment_status_check
      CHECK (employment_status IN ('active', 'probation', 'on_leave', 'contractor'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_users_availability_status_check') THEN
    ALTER TABLE staff_users ADD CONSTRAINT staff_users_availability_status_check
      CHECK (availability_status IN ('available', 'busy', 'away', 'dnd', 'offline'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_users_preferred_contact_check') THEN
    ALTER TABLE staff_users ADD CONSTRAINT staff_users_preferred_contact_check
      CHECK (preferred_contact IN ('message', 'email', 'phone'));
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS staff_users_employee_id_idx
  ON staff_users(employee_id) WHERE employee_id IS NOT NULL AND employee_id <> '';

CREATE TABLE IF NOT EXISTS staff_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('milestone', 'training', 'certification', 'award', 'recognition', 'accomplishment')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  occurred_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS staff_achievements_user_idx ON staff_achievements(user_id, occurred_on DESC NULLS LAST, created_at DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ledgeroofing_app') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON staff_achievements TO ledgeroofing_app';
  END IF;
END
$$;