-- A revoked password or an expired slot keeps its index and stays visible.
-- requires_reauth rows still occupy account_sessions_active_slot because revoked_at stays null.
-- Signing out of one account sets revoked_at and frees the index.
ALTER TABLE account_sessions
    ADD COLUMN requires_reauth BOOLEAN NOT NULL DEFAULT FALSE;
