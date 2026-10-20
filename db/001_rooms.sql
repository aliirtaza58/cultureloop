-- Application state persists independently of agent sessions and traces.
CREATE TABLE IF NOT EXISTS cultureloop_rooms (
  id uuid PRIMARY KEY,
  invite_hash char(64) UNIQUE NOT NULL,
  state jsonb NOT NULL,
  revision integer NOT NULL CHECK (revision >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(state) = 'object')
);

CREATE TABLE IF NOT EXISTS cultureloop_memberships (
  room_id uuid NOT NULL REFERENCES cultureloop_rooms(id) ON DELETE CASCADE,
  member_id uuid NOT NULL,
  session_hash char(64) NOT NULL,
  alias varchar(50) NOT NULL CHECK (length(trim(alias)) > 0),
  PRIMARY KEY (room_id, member_id),
  UNIQUE (room_id, session_hash)
);

CREATE TABLE IF NOT EXISTS cultureloop_holds (
  room_id uuid NOT NULL REFERENCES cultureloop_rooms(id) ON DELETE CASCADE,
  listing_id varchar(200) NOT NULL,
  cycle_id text NOT NULL,
  cycle_revision integer NOT NULL CHECK (cycle_revision >= 1),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (room_id, listing_id)
);
CREATE INDEX IF NOT EXISTS cultureloop_hold_expiry ON cultureloop_holds (expires_at);

CREATE TABLE IF NOT EXISTS cultureloop_qloo_cache (
  cache_key char(64) PRIMARY KEY,
  payload jsonb NOT NULL,
  retrieved_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cultureloop_rate_limits (
  bucket_key char(64) PRIMARY KEY,
  window_start timestamptz NOT NULL,
  requests integer NOT NULL CHECK (requests > 0)
);
