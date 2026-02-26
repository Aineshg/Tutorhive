-- Drop existing unique constraint that allows only one slot per day
DROP INDEX IF EXISTS "tutor_availability_tutor_id_day_of_week_key";

-- Create supporting index for querying availability by tutor and day
CREATE INDEX IF NOT EXISTS "tutor_availability_tutor_id_day_of_week_idx"
ON "tutor_availability"("tutor_id", "day_of_week");

-- Ensure individual slots remain unique for a tutor/day/time combination
CREATE UNIQUE INDEX IF NOT EXISTS "tutor_availability_tutor_id_day_of_week_start_time_end_time_key"
ON "tutor_availability"("tutor_id", "day_of_week", "start_time", "end_time");

