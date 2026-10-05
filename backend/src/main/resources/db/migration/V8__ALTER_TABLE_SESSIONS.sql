ALTER TABLE sessions ADD COLUMN user_id BIGINT NULL;
ALTER TABLE sessions ADD CONSTRAINT chk_Sessions_unsigned_integer_user_id CHECK (user_id IS NULL OR (user_id BETWEEN 0 AND 4294967295));
CREATE INDEX sessions_user_id ON sessions (user_id);

-- Backfill from the stored session document. The payload stays as Ktor wrote it.
DO $$
DECLARE
    rec record;
    parsed bigint;
BEGIN
    FOR rec IN
        SELECT session_id, "session" AS payload
        FROM sessions
        WHERE user_id IS NULL
    LOOP
        BEGIN
            parsed := ((rec.payload::jsonb)->'user'->>'id')::bigint;
            IF parsed BETWEEN 0 AND 4294967295 THEN
                UPDATE sessions SET user_id = parsed WHERE session_id = rec.session_id;
            END IF;
        EXCEPTION
            WHEN others THEN
                NULL;
        END;
    END LOOP;
END $$;
