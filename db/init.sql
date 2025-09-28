CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS site (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  zonas JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS person (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL,
  jerarquia TEXT,
  especialidad TEXT,
  unidad TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shift (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES person(id) ON DELETE CASCADE,
  start_ts TIMESTAMPTZ NOT NULL,
  end_ts TIMESTAMPTZ NOT NULL,
  site_id UUID REFERENCES site(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS shift_person_idx ON shift(person_id);
CREATE INDEX IF NOT EXISTS shift_start_idx ON shift(start_ts);

CREATE TABLE IF NOT EXISTS presence_event (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES person(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS presence_event_person_idx ON presence_event(person_id);
CREATE INDEX IF NOT EXISTS presence_event_ts_idx ON presence_event(ts);

CREATE TABLE IF NOT EXISTS status_snapshot (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES person(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS status_snapshot_person_ts_idx ON status_snapshot(person_id, ts DESC);
CREATE INDEX IF NOT EXISTS status_snapshot_person_idx ON status_snapshot(person_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES person(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ts TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_log_person_idx ON audit_log(person_id);

