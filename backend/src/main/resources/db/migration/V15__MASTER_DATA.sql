-- Promote tags to a master and add customers / products.
-- Duplicate tag names keep the lowest id; the rest are renamed before UNIQUE(name).
-- sort_key is a fractional-index key (same sequence as fractional-indexing's default digits)
-- and is compared with COLLATE "C".

-- BEGIN axcira_next_sort_key
CREATE OR REPLACE FUNCTION axcira_next_sort_key(prev text) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
    digits constant text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    heads constant text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    head_char text;
    head_index int;
    int_len int;
    int_part text;
    i int;
    digit_pos int;
    suffix text;
    new_head text;
    new_len int;
    length_delta int;
    zero_char constant text := '0';
BEGIN
    IF prev IS NULL OR btrim(prev) = '' THEN
        RETURN 'a0';
    END IF;

    head_char := substr(prev, 1, 1);
    head_index := position(head_char IN heads) - 1;
    IF head_index < 0 THEN
        RAISE EXCEPTION 'invalid order key head: %', head_char;
    END IF;
    IF head_index < 26 THEN
        int_len := 26 - head_index + 1;
    ELSE
        int_len := head_index - 26 + 2;
    END IF;
    IF int_len > length(prev) THEN
        RAISE EXCEPTION 'invalid order key: %', prev;
    END IF;
    int_part := substr(prev, 1, int_len);

    suffix := '';
    i := length(int_part);
    WHILE i >= 2 LOOP
        digit_pos := position(substr(int_part, i, 1) IN digits);
        IF digit_pos = 0 THEN
            RAISE EXCEPTION 'invalid digit in %', prev;
        END IF;
        IF digit_pos = length(digits) THEN
            suffix := zero_char || suffix;
            i := i - 1;
        ELSE
            RETURN substr(int_part, 1, 1)
                || substr(int_part, 2, i - 2)
                || substr(digits, digit_pos + 1, 1)
                || suffix;
        END IF;
    END LOOP;

    IF head_index = length(heads) - 1 THEN
        RAISE EXCEPTION 'cannot increment any more';
    END IF;
    new_head := substr(heads, head_index + 2, 1);
    IF head_index + 1 < 26 THEN
        new_len := 26 - (head_index + 1) + 1;
    ELSE
        new_len := (head_index + 1) - 26 + 2;
    END IF;
    length_delta := new_len - int_len;
    IF length_delta > 0 THEN
        RETURN new_head || suffix || zero_char;
    ELSIF length_delta < 0 THEN
        RETURN new_head || substr(suffix, 2);
    ELSE
        RETURN new_head || suffix;
    END IF;
END;
$$;
-- END axcira_next_sort_key

DO $$
BEGIN
    WHILE EXISTS (
        SELECT 1 FROM tags GROUP BY name HAVING count(*) > 1
    ) LOOP
        UPDATE tags AS t
        SET name = left(t.name, 200) || ' #' || t.id::text
        WHERE t.id IN (
            SELECT id FROM (
                SELECT id, row_number() OVER (PARTITION BY name ORDER BY id) AS rn
                FROM tags
            ) ranked
            WHERE rn > 1
        );
    END LOOP;
END $$;

ALTER TABLE tags ADD COLUMN sort_key VARCHAR(255) COLLATE "C";
ALTER TABLE tags ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE tags ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE tags ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$
DECLARE
    tag_row record;
    previous text := NULL;
BEGIN
    FOR tag_row IN SELECT id FROM tags ORDER BY id LOOP
        previous := axcira_next_sort_key(previous);
        UPDATE tags SET sort_key = previous WHERE id = tag_row.id;
    END LOOP;
END $$;

ALTER TABLE tags ALTER COLUMN sort_key SET NOT NULL;
ALTER TABLE tags ADD CONSTRAINT tags_name_unique UNIQUE (name);
ALTER TABLE tags ADD CONSTRAINT tags_sort_key_unique UNIQUE (sort_key);

ALTER TABLE articletags DROP CONSTRAINT fk_articletags_tag_id__id;
ALTER TABLE articletags ADD CONSTRAINT fk_articletags_tag_id__id
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE RESTRICT ON UPDATE RESTRICT;

DROP FUNCTION axcira_next_sort_key(text);

CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(64) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    sort_key VARCHAR(255) COLLATE "C" NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT customers_code_unique UNIQUE (code),
    CONSTRAINT customers_sort_key_unique UNIQUE (sort_key),
    CONSTRAINT chk_Customers_unsigned_integer_id CHECK (id BETWEEN 0 AND 4294967295)
);
CREATE SEQUENCE IF NOT EXISTS Customers_id_seq START WITH 1 MINVALUE 1 MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(64) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    customer_id BIGINT NOT NULL,
    sort_key VARCHAR(255) COLLATE "C" NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT products_code_unique UNIQUE (code),
    CONSTRAINT products_sort_key_unique UNIQUE (sort_key),
    CONSTRAINT fk_products_customer_id__id FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_Products_unsigned_integer_id CHECK (id BETWEEN 0 AND 4294967295)
);
CREATE SEQUENCE IF NOT EXISTS Products_id_seq START WITH 1 MINVALUE 1 MAXVALUE 9223372036854775807;
