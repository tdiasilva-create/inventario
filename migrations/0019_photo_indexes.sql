-- Additive read indexes only; no photograph or provider data is rewritten.
CREATE INDEX collection_photos_inspection ON collection_photos(inspection_id,created_at DESC,id DESC);
CREATE INDEX collection_photos_unit_status ON collection_photos(unit_id,status,created_at DESC);
