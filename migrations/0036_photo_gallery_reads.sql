-- D125. Additive metadata/indexes only; no original, thumbnail or history rewrite.
-- Both Workers must see this migration before deploying the new photo readers.
CREATE INDEX collection_photos_ready_date ON collection_photos(created_at DESC,id DESC) WHERE status='ready';
CREATE INDEX collection_photos_ready_unit_date ON collection_photos(unit_id,created_at DESC,id DESC) WHERE status='ready';
CREATE INDEX collection_photos_thumb_repair ON collection_photos(created_at,id)
 WHERE status='ready' AND (thumb_blob IS NULL OR thumb_source_sha256 IS NOT sha256);

CREATE TABLE photo_gallery_revision (
 id INTEGER PRIMARY KEY CHECK(id=1),epoch TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0
);
INSERT INTO photo_gallery_revision(id,epoch) VALUES(1,lower(hex(randomblob(16))));

-- Count eligibility: ready photo + active/in-scope unit + open/paused/completed
-- visit; completed equipment photographs also require a published equipment.
-- Changes to image bytes, thumbnail metadata, GPS and heartbeats do NOT count.
CREATE TRIGGER photo_gallery_photo_insert AFTER INSERT ON collection_photos WHEN NEW.status='ready' BEGIN
 UPDATE photo_gallery_revision SET revision=revision+1 WHERE id=1;
END;
CREATE TRIGGER photo_gallery_photo_delete AFTER DELETE ON collection_photos WHEN OLD.status='ready' BEGIN
 UPDATE photo_gallery_revision SET revision=revision+1 WHERE id=1;
END;
CREATE TRIGGER photo_gallery_photo_update AFTER UPDATE OF unit_id,inspection_id,target_kind,target_id,status ON collection_photos
 WHEN (OLD.status='ready' OR NEW.status='ready') AND (OLD.unit_id IS NOT NEW.unit_id OR OLD.inspection_id IS NOT NEW.inspection_id OR OLD.target_kind IS NOT NEW.target_kind OR OLD.target_id IS NOT NEW.target_id OR OLD.status IS NOT NEW.status) BEGIN
 UPDATE photo_gallery_revision SET revision=revision+1 WHERE id=1;
END;
CREATE TRIGGER photo_gallery_unit_insert AFTER INSERT ON units BEGIN
 UPDATE photo_gallery_revision SET revision=revision+1 WHERE id=1;
END;
CREATE TRIGGER photo_gallery_unit_delete AFTER DELETE ON units BEGIN
 UPDATE photo_gallery_revision SET revision=revision+1 WHERE id=1;
END;
CREATE TRIGGER photo_gallery_unit_update AFTER UPDATE OF id,active,unit_type ON units
 WHEN OLD.id IS NOT NEW.id OR OLD.active IS NOT NEW.active OR OLD.unit_type IS NOT NEW.unit_type BEGIN
 UPDATE photo_gallery_revision SET revision=revision+1 WHERE id=1;
END;
CREATE TRIGGER photo_gallery_inspection_insert AFTER INSERT ON inspections BEGIN
 UPDATE photo_gallery_revision SET revision=revision+1 WHERE id=1;
END;
CREATE TRIGGER photo_gallery_inspection_delete AFTER DELETE ON inspections BEGIN
 UPDATE photo_gallery_revision SET revision=revision+1 WHERE id=1;
END;
CREATE TRIGGER photo_gallery_inspection_update AFTER UPDATE OF id,unit_id,state ON inspections
 WHEN OLD.id IS NOT NEW.id OR OLD.unit_id IS NOT NEW.unit_id OR OLD.state IS NOT NEW.state BEGIN
 UPDATE photo_gallery_revision SET revision=revision+1 WHERE id=1;
END;
CREATE TRIGGER photo_gallery_equipment_insert AFTER INSERT ON equipments WHEN NEW.published_json IS NOT NULL BEGIN
 UPDATE photo_gallery_revision SET revision=revision+1 WHERE id=1;
END;
CREATE TRIGGER photo_gallery_equipment_delete AFTER DELETE ON equipments WHEN OLD.published_json IS NOT NULL BEGIN
 UPDATE photo_gallery_revision SET revision=revision+1 WHERE id=1;
END;
CREATE TRIGGER photo_gallery_equipment_update AFTER UPDATE OF id,unit_id,published_json ON equipments
 WHEN (OLD.published_json IS NOT NULL OR NEW.published_json IS NOT NULL) AND (OLD.id IS NOT NEW.id OR OLD.unit_id IS NOT NEW.unit_id OR (OLD.published_json IS NULL)<>(NEW.published_json IS NULL)) BEGIN
 UPDATE photo_gallery_revision SET revision=revision+1 WHERE id=1;
END;
CREATE TRIGGER photo_gallery_misc_insert AFTER INSERT ON miscellaneous_equipments WHEN NEW.published_json IS NOT NULL BEGIN
 UPDATE photo_gallery_revision SET revision=revision+1 WHERE id=1;
END;
CREATE TRIGGER photo_gallery_misc_delete AFTER DELETE ON miscellaneous_equipments WHEN OLD.published_json IS NOT NULL BEGIN
 UPDATE photo_gallery_revision SET revision=revision+1 WHERE id=1;
END;
CREATE TRIGGER photo_gallery_misc_update AFTER UPDATE OF id,unit_id,published_json ON miscellaneous_equipments
 WHEN (OLD.published_json IS NOT NULL OR NEW.published_json IS NOT NULL) AND (OLD.id IS NOT NEW.id OR OLD.unit_id IS NOT NEW.unit_id OR (OLD.published_json IS NULL)<>(NEW.published_json IS NULL)) BEGIN
 UPDATE photo_gallery_revision SET revision=revision+1 WHERE id=1;
END;
