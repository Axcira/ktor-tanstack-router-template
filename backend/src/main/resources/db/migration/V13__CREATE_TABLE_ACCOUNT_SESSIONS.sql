CREATE TABLE account_sessions (
    id BIGSERIAL PRIMARY KEY,
    device_session_id VARCHAR(64) NOT NULL,
    account_index INTEGER NOT NULL,
    user_id BIGINT NOT NULL,
    created_at BIGINT NOT NULL,
    expires_at BIGINT NOT NULL,
    revoked_at BIGINT NULL,
    activated_at BIGINT NOT NULL,
    CONSTRAINT chk_account_sessions_index CHECK (account_index BETWEEN 0 AND 9),
    CONSTRAINT chk_account_sessions_unsigned_user_id CHECK (user_id BETWEEN 0 AND 4294967295),
    CONSTRAINT fk_account_sessions_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- One live slot per index. Revoked rows keep their index in history and free the slot for reuse.
CREATE UNIQUE INDEX account_sessions_active_slot
    ON account_sessions (device_session_id, account_index)
    WHERE revoked_at IS NULL;

CREATE INDEX account_sessions_device_session_id ON account_sessions (device_session_id);
CREATE INDEX account_sessions_user_id ON account_sessions (user_id);

-- Carry each existing single-user session forward as account index 0.
-- Account timestamps are epoch milliseconds; sessions.expires_at is epoch seconds.
INSERT INTO account_sessions (
    device_session_id,
    account_index,
    user_id,
    created_at,
    expires_at,
    revoked_at,
    activated_at
)
SELECT
    s.session_id,
    0,
    s.user_id,
    (COALESCE(s.expires_at, EXTRACT(EPOCH FROM NOW())::BIGINT) - 604800) * 1000,
    COALESCE(s.expires_at, EXTRACT(EPOCH FROM NOW())::BIGINT + 604800) * 1000,
    NULL,
    (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
FROM sessions s
WHERE s.user_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id);

-- The cookie still holds only the device session id. The stored document is a device-session marker.
UPDATE sessions
SET "session" = jsonb_build_object('defaultUserId', user_id)::text
WHERE user_id IS NOT NULL;

UPDATE sessions
SET "session" = '{}'::text
WHERE user_id IS NULL;
