-- D-068: cadastro mestre opcional. Sem carga/reclassificação de unidades.
ALTER TABLE units ADD COLUMN students_total INTEGER CHECK(students_total IS NULL OR (typeof(students_total)='integer' AND students_total BETWEEN 0 AND 99999));
ALTER TABLE units ADD COLUMN students_daycare INTEGER CHECK(students_daycare IS NULL OR (typeof(students_daycare)='integer' AND students_daycare BETWEEN 0 AND 99999));
ALTER TABLE units ADD COLUMN students_preschool INTEGER CHECK(students_preschool IS NULL OR (typeof(students_preschool)='integer' AND students_preschool BETWEEN 0 AND 99999));
ALTER TABLE units ADD COLUMN students_early_years INTEGER CHECK(students_early_years IS NULL OR (typeof(students_early_years)='integer' AND students_early_years BETWEEN 0 AND 99999));
ALTER TABLE units ADD COLUMN students_final_years INTEGER CHECK(students_final_years IS NULL OR (typeof(students_final_years)='integer' AND students_final_years BETWEEN 0 AND 99999));
ALTER TABLE units ADD COLUMN students_eja INTEGER CHECK(students_eja IS NULL OR (typeof(students_eja)='integer' AND students_eja BETWEEN 0 AND 99999));
ALTER TABLE units ADD COLUMN classes_total INTEGER CHECK(classes_total IS NULL OR (typeof(classes_total)='integer' AND classes_total BETWEEN 0 AND 99999));
ALTER TABLE units ADD COLUMN seats_available INTEGER CHECK(seats_available IS NULL OR (typeof(seats_available)='integer' AND seats_available BETWEEN 0 AND 99999));
ALTER TABLE units ADD COLUMN capacity_total INTEGER CHECK(capacity_total IS NULL OR (typeof(capacity_total)='integer' AND capacity_total BETWEEN 0 AND 99999));
ALTER TABLE units ADD COLUMN staff_total INTEGER CHECK(staff_total IS NULL OR (typeof(staff_total)='integer' AND staff_total BETWEEN 0 AND 99999));
ALTER TABLE units ADD COLUMN teachers_total INTEGER CHECK(teachers_total IS NULL OR (typeof(teachers_total)='integer' AND teachers_total BETWEEN 0 AND 99999));
ALTER TABLE units ADD COLUMN building_code TEXT NOT NULL DEFAULT '';
ALTER TABLE units ADD COLUMN notes TEXT NOT NULL DEFAULT '';
ALTER TABLE units ADD COLUMN figures_source TEXT NOT NULL DEFAULT '';
ALTER TABLE units ADD COLUMN figures_reference_date TEXT;
