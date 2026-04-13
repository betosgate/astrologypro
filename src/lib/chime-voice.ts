import {
  SearchAvailablePhoneNumbersCommand,
  CreatePhoneNumberOrderCommand,
  DeletePhoneNumberCommand,
  AssociatePhoneNumbersWithVoiceConnectorCommand,
} from "@aws-sdk/client-chime-sdk-voice";
import { getChimeVoiceClient } from "./chime-client";
import { createAdminClient } from "./supabase/admin";

const CHIME_SMA_ID = process.env.CHIME_SMA_ID ?? "";

/**
 * Provision a Chime PSTN phone number for a diviner.
 * Mirrors the Twilio provisionPhoneNumber() function in twilio-voice.ts.
 */
export async function provisionChimePhoneNumber(
  divinerId: string
): Promise<{ phoneNumber: string; phoneArn: string }> {
  const voice = getChimeVoiceClient();

  // Search for available US local numbers
  const searchResult = await voice.send(
    new SearchAvailablePhoneNumbersCommand({
      PhoneNumberType: "Local",
      Country: "US",
      MaxResults: 1,
    })
  );

  const availableNumbers = searchResult.E164PhoneNumbers ?? [];
  if (availableNumbers.length === 0) {
    throw new Error("No available Chime PSTN phone numbers");
  }

  const phoneNumber = availableNumbers[0];

  // Order the phone number
  const orderResult = await voice.send(
    new CreatePhoneNumberOrderCommand({
      ProductType: "SipMediaApplicationDialIn",
      E164PhoneNumbers: [phoneNumber],
    })
  );

  const order = orderResult.PhoneNumberOrder;
  if (!order?.PhoneNumberOrderId) {
    throw new Error("Failed to order Chime phone number");
  }

  // The phone number ARN will be available once the order completes.
  // For now, store the order ID and phone number.
  // In production, you'd poll GetPhoneNumberOrder until status is "Successful"
  // and then associate the number with the SMA.
  const phoneArn = `arn:aws:chime:us-east-1:phone-number/${phoneNumber}`;

  // Save to diviner record
  const admin = createAdminClient();
  const { error } = await admin
    .from("diviners")
    .update({
      chime_phone_number: phoneNumber,
      chime_sma_phone_arn: phoneArn,
      phone_provider: "chime",
    })
    .eq("id", divinerId);

  if (error) {
    throw new Error(`Failed to save Chime phone to diviner: ${error.message}`);
  }

  return { phoneNumber, phoneArn };
}

/**
 * Release a Chime PSTN phone number from a diviner.
 * Mirrors the Twilio releasePhoneNumber() function.
 */
export async function releaseChimePhoneNumber(
  divinerId: string
): Promise<void> {
  const admin = createAdminClient();

  // Fetch diviner's Chime phone info
  const { data: diviner } = await admin
    .from("diviners")
    .select("chime_phone_number, chime_sma_phone_arn")
    .eq("id", divinerId)
    .single();

  if (!diviner?.chime_phone_number) {
    throw new Error("Diviner does not have a Chime phone number");
  }

  const voice = getChimeVoiceClient();

  try {
    await voice.send(
      new DeletePhoneNumberCommand({
        PhoneNumberId: diviner.chime_phone_number,
      })
    );
  } catch (err) {
    console.error("Failed to delete Chime phone number:", err);
    // Continue with DB cleanup even if API fails
  }

  // Clear diviner record
  await admin
    .from("diviners")
    .update({
      chime_phone_number: null,
      chime_sma_phone_arn: null,
    })
    .eq("id", divinerId);
}
