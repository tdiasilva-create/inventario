-- D-099: dated immutable reports, independent of live catalog deletion/renaming.
CREATE TABLE provider_report_schedule (
 id INTEGER PRIMARY KEY CHECK(id=1),
 started_at TEXT NOT NULL,
 next_due_at TEXT NOT NULL
);
CREATE TABLE provider_reports (
 id TEXT PRIMARY KEY,
 period_key TEXT NOT NULL UNIQUE,
 kind TEXT NOT NULL CHECK(kind IN ('initial','weekly')),
 scheduled_at TEXT NOT NULL,
 generated_at TEXT NOT NULL,
 missed_weeks INTEGER NOT NULL DEFAULT 0 CHECK(missed_weeks>=0),
 unit_count INTEGER NOT NULL CHECK(unit_count>=0),
 with_provider INTEGER NOT NULL CHECK(with_provider>=0 AND with_provider<=unit_count),
 report_json TEXT NOT NULL CHECK(json_valid(report_json))
);
CREATE INDEX provider_reports_chronology ON provider_reports(generated_at DESC,id DESC);
CREATE TRIGGER provider_reports_immutable BEFORE UPDATE ON provider_reports
BEGIN SELECT RAISE(ABORT,'PROVIDER_REPORT_IMMUTABLE'); END;
