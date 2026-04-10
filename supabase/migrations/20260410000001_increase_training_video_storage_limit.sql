-- Increase the training-videos bucket file size limit to 500 MB (524288000 bytes).
-- The UI and the server upload route both advertise a 500 MB limit,
-- but the bucket's internal cap was lower, causing ~300 MB uploads to fail
-- with "The object exceeded the maximum allowed size".

UPDATE storage.buckets
SET file_size_limit = 524288000
WHERE id = 'training-videos';
