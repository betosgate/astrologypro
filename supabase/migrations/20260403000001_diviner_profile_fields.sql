-- Add missing profile fields to diviners table
ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS cover_image_url        text,
  ADD COLUMN IF NOT EXISTS phone                  text,
  ADD COLUMN IF NOT EXISTS youtube_channel_id     text,
  ADD COLUMN IF NOT EXISTS facebook_live_url      text;

-- Stripe Connect status flags (updated by webhook on account.updated)
ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS charges_enabled        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS payouts_enabled        boolean DEFAULT false;

-- Google Calendar connection flag (derived from google_calendar_token)
ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS google_calendar_connected boolean
    GENERATED ALWAYS AS (google_calendar_token IS NOT NULL) STORED;

-- Twilio provisioned number (set when diviner enables phone readings)
ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS twilio_phone_number    varchar(20),
  ADD COLUMN IF NOT EXISTS twilio_phone_sid       varchar(64);

-- Notification preferences
ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS notification_email               boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_sms                 boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_booking_confirmed   boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_booking_cancelled   boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_payout              boolean DEFAULT true;
