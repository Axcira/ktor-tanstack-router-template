ALTER TABLE sessions ADD COLUMN expires_at BIGINT NULL;
UPDATE sessions SET expires_at = (EXTRACT(EPOCH FROM NOW())::BIGINT + 604800) WHERE expires_at IS NULL;
CREATE INDEX sessions_expires_at ON sessions (expires_at);
