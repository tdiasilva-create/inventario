-- D-072: exception approved on 09/11/2026 for derived JPEG thumbnails only.
-- Full photographs remain in the private storage provider. No original is changed.
ALTER TABLE collection_photos ADD COLUMN thumb_blob BLOB CHECK(thumb_blob IS NULL OR length(thumb_blob)<=65536);
ALTER TABLE collection_photos ADD COLUMN thumb_mime TEXT CHECK(thumb_mime IS NULL OR thumb_mime='image/jpeg');
ALTER TABLE collection_photos ADD COLUMN thumb_width INTEGER CHECK(thumb_width IS NULL OR thumb_width BETWEEN 1 AND 320);
ALTER TABLE collection_photos ADD COLUMN thumb_height INTEGER CHECK(thumb_height IS NULL OR thumb_height BETWEEN 1 AND 320);
ALTER TABLE collection_photos ADD COLUMN thumb_sha256 TEXT;
ALTER TABLE collection_photos ADD COLUMN thumb_source_sha256 TEXT;
ALTER TABLE collection_photos ADD COLUMN thumb_created_at INTEGER;
ALTER TABLE collection_photos ADD COLUMN thumb_created_by TEXT;
CREATE INDEX collection_photos_missing_thumb ON collection_photos(created_at,id) WHERE status='ready' AND thumb_blob IS NULL;
