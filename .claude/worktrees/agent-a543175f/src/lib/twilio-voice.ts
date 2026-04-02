import { createAdminClient } from "@/lib/supabase/admin";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function twilioHeaders(): HeadersInit {
  const credentials = Buffer.from(
    `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
  ).toString("base64");
  return {
    Authorization: `Basic ${credentials}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

/**
 * Provision a Twilio phone number for a diviner.
 * Searches for an available local US number, purchases it, and configures the
 * voice webhook to point at our incoming call handler.
 */
export async function provisionPhoneNumber(divinerId: string) {
  // 1. Search for an available number
  const searchUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/AvailablePhoneNumbers/US/Local.json?Limit=1`;
  const searchRes = await fetch(searchUrl, { headers: twilioHeaders() });
  if (!searchRes.ok) {
    const err = await searchRes.text();
    throw new Error(`Failed to search for available numbers: ${err}`);
  }
  const searchData = await searchRes.json();
  const availableNumber = searchData.available_phone_numbers?.[0];
  if (!availableNumber) {
    throw new Error("No available phone numbers found");
  }

  // 2. Purchase the number and set the voice webhook
  const purchaseUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json`;
  const purchaseBody = new URLSearchParams({
    PhoneNumber: availableNumber.phone_number,
    VoiceUrl: `${APP_URL}/api/twilio/voice/incoming`,
    VoiceMethod: "POST",
    StatusCallback: `${APP_URL}/api/twilio/voice/status`,
    StatusCallbackMethod: "POST",
    StatusCallbackEvent: "completed",
  });

  const purchaseRes = await fetch(purchaseUrl, {
    method: "POST",
    headers: twilioHeaders(),
    body: purchaseBody.toString(),
  });

  if (!purchaseRes.ok) {
    const err = await purchaseRes.text();
    throw new Error(`Failed to purchase phone number: ${err}`);
  }

  const purchaseData = await purchaseRes.json();

  // 3. Save to diviner record
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("diviners")
    .update({
      twilio_phone_number: purchaseData.phone_number,
      twilio_phone_sid: purchaseData.sid,
      phone_dialin_enabled: true,
    })
    .eq("id", divinerId);

  if (error) {
    throw new Error(`Failed to save phone number to diviner: ${error.message}`);
  }

  return {
    phoneNumber: purchaseData.phone_number,
    phoneSid: purchaseData.sid,
  };
}

/**
 * Release a Twilio phone number when a diviner cancels or no longer needs it.
 */
export async function releasePhoneNumber(divinerId: string) {
  const supabase = createAdminClient();

  // Fetch the current phone SID
  const { data: diviner, error: fetchError } = await supabase
    .from("diviners")
    .select("twilio_phone_sid")
    .eq("id", divinerId)
    .single();

  if (fetchError || !diviner?.twilio_phone_sid) {
    throw new Error("No phone number found for this diviner");
  }

  // Release the number via Twilio API
  const releaseUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers/${diviner.twilio_phone_sid}.json`;
  const releaseRes = await fetch(releaseUrl, {
    method: "DELETE",
    headers: twilioHeaders(),
  });

  if (!releaseRes.ok && releaseRes.status !== 404) {
    const err = await releaseRes.text();
    throw new Error(`Failed to release phone number: ${err}`);
  }

  // Clear the diviner record
  const { error } = await supabase
    .from("diviners")
    .update({
      twilio_phone_number: null,
      twilio_phone_sid: null,
      phone_dialin_enabled: false,
    })
    .eq("id", divinerId);

  if (error) {
    throw new Error(`Failed to clear phone number from diviner: ${error.message}`);
  }
}
