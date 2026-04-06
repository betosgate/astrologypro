-- Certificate verification: add unique certificate_code to trainees
ALTER TABLE trainees
  ADD COLUMN IF NOT EXISTS certificate_code TEXT UNIQUE;

-- Generate unique certificate code for already-graduated trainees
UPDATE trainees
SET certificate_code = UPPER(SUBSTRING(MD5(id::text || 'cert_salt_2026'), 1, 12))
WHERE graduated_at IS NOT NULL AND certificate_code IS NULL;
