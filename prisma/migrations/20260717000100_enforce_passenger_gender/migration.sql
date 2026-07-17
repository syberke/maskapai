-- Preserve legacy rows without inventing a male/female value.
UPDATE "BookingSeat"
SET "passengerGender" = 'UNKNOWN'
WHERE "passengerGender" IS NULL
   OR "passengerGender" NOT IN ('MALE', 'FEMALE', 'UNKNOWN');

ALTER TABLE "BookingSeat"
  ALTER COLUMN "passengerGender" SET DEFAULT 'UNKNOWN',
  ALTER COLUMN "passengerGender" SET NOT NULL;

ALTER TABLE "BookingSeat"
  ADD CONSTRAINT "BookingSeat_passengerGender_check"
  CHECK ("passengerGender" IN ('MALE', 'FEMALE', 'UNKNOWN'));
