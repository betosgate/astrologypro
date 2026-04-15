import {
  SearchAvailablePhoneNumbersCommand,
  CreatePhoneNumberOrderCommand,
  GetPhoneNumberOrderCommand,
  GetPhoneNumberCommand,
  DeletePhoneNumberCommand,
  CreateSipRuleCommand,
  DeleteSipRuleCommand,
} from "@aws-sdk/client-chime-sdk-voice";
import { getChimeVoiceClient } from "./chime-client";
import { createAdminClient } from "./supabase/admin";

/**
 * Provision a Chime PSTN phone number for a diviner.
 *
 * Steps:
 *   1. Search for an available US local number
 *   2. Create a phone number order
 *   3. Poll GetPhoneNumberOrder until status = "Successful" (max 90 s)
 *   4. Fetch the real phone number ARN via GetPhoneNumber
 *   5. Create a SIP Rule that routes inbound calls on this number to the SMA
 *   6. Persist phone number, real ARN, and SIP rule ID to the diviner record
 *
 * Mirrors the Twilio provisionPhoneNumber() function in twilio-voice.ts.
 */
export async function provisionChimePhoneNumber(
  divinerId: string,
  areaCode?: string
): Promise<{ phoneNumber: string; phoneArn: string }> {
  const smaId = process.env.CHIME_SMA_ID;
  if (!smaId) throw new Error("CHIME_SMA_ID env var not set");

  const voice = getChimeVoiceClient();

  // ── Step 1: Search for an available US number ────────────────────────────
  // AWS Chime SDK Voice requires specific parameters per phone number type:
  //   - Local:    AreaCode (3-digit US) OR (State + optional City)
  //   - TollFree: TollFreePrefix (e.g. "800", "888", "877", "866", "855", "844", "833")
  // Omitting these causes BadRequestException: "required search parameters are empty".
  let availableNumbers: string[] = [];

  // Validate area code — must be 3-digit US area code
  const sanitizedAreaCode = (areaCode || "212").replace(/\D/g, "");
  if (sanitizedAreaCode.length !== 3) {
    throw new Error(
      `Invalid area code "${areaCode}". Must be a 3-digit US area code (e.g. "212", "310", "415").`
    );
  }

  // Try Local first
  try {
    console.log(`[Chime] Searching Local numbers with AreaCode=${sanitizedAreaCode}...`);
    const localResult = await voice.send(
      new SearchAvailablePhoneNumbersCommand({
        PhoneNumberType: "Local",
        Country: "US",
        AreaCode: sanitizedAreaCode,
        MaxResults: 1,
      })
    );
    availableNumbers = localResult.E164PhoneNumbers ?? [];
    console.log(`[Chime] Local search returned ${availableNumbers.length} numbers`);
  } catch (err) {
    console.warn("[Chime] Local number search failed, trying TollFree:", err);
  }

  // Fall back to TollFree — requires TollFreePrefix
  const TOLL_FREE_PREFIXES = ["800", "888", "877", "866", "855", "844", "833"];
  if (availableNumbers.length === 0) {
    for (const prefix of TOLL_FREE_PREFIXES) {
      try {
        console.log(`[Chime] Searching TollFree numbers with prefix=${prefix}...`);
        const tollFreeResult = await voice.send(
          new SearchAvailablePhoneNumbersCommand({
            PhoneNumberType: "TollFree",
            Country: "US",
            TollFreePrefix: prefix,
            MaxResults: 1,
          })
        );
        availableNumbers = tollFreeResult.E164PhoneNumbers ?? [];
        if (availableNumbers.length > 0) {
          console.log(`[Chime] TollFree search (${prefix}) returned ${availableNumbers.length} numbers`);
          break;
        }
      } catch (err) {
        console.warn(`[Chime] TollFree search (${prefix}) failed:`, err);
      }
    }
  }

  if (availableNumbers.length === 0) {
    throw new Error(
      "No available Chime PSTN phone numbers. " +
      "This usually means the AWS account needs a Service Quota increase. " +
      "Go to AWS Console → Service Quotas → Amazon Chime SDK → Phone Number and request an increase."
    );
  }

  const phoneNumber = availableNumbers[0];

  // ── Step 2: Create the phone number order ────────────────────────────────
  const orderResult = await voice.send(
    new CreatePhoneNumberOrderCommand({
      ProductType: "SipMediaApplicationDialIn",
      E164PhoneNumbers: [phoneNumber],
    })
  );

  const order = orderResult.PhoneNumberOrder;
  if (!order?.PhoneNumberOrderId) {
    throw new Error("Failed to create Chime phone number order");
  }

  const orderId = order.PhoneNumberOrderId;

  // ── Step 3: Poll until order completes (max 90 s, 3 s intervals) ─────────
  let orderStatus = "Processing";
  let attempts = 0;
  const maxAttempts = 30; // 30 × 3 s = 90 s

  while (orderStatus === "Processing" && attempts < maxAttempts) {
    await new Promise((r) => setTimeout(r, 3000));
    const pollResult = await voice.send(
      new GetPhoneNumberOrderCommand({ PhoneNumberOrderId: orderId })
    );
    orderStatus = pollResult.PhoneNumberOrder?.Status ?? "Failed";
    attempts++;
  }

  if (orderStatus !== "Successful") {
    throw new Error(
      `Chime phone number order ${orderId} ended with status "${orderStatus}" after ${attempts} poll attempts`
    );
  }

  // ── Step 4: Fetch the real phone number ARN ───────────────────────────────
  const phoneDetails = await voice.send(
    new GetPhoneNumberCommand({ PhoneNumberId: phoneNumber })
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const realArn =
    (phoneDetails.PhoneNumber as any)?.PhoneNumberArn as string | undefined ??
    `arn:aws:chime:us-east-1:phone-number/${phoneNumber}`;

  // ── Step 5: Create a SIP Rule to route inbound calls to the SMA ──────────
  // In AWS Chime SDK Voice, phone numbers are associated with an SMA by
  // creating a SIP Rule with TriggerType=ToPhoneNumber and a target pointing
  // at the SMA. There is no direct AssociatePhoneNumbersWithSipMediaApplication
  // command in the V2 SDK — routing is done entirely through SIP Rules.
  const sipRuleResult = await voice.send(
    new CreateSipRuleCommand({
      Name: `diviner-${divinerId}-${phoneNumber.replace(/[^a-zA-Z0-9 _.-]/g, "")}`,
      TriggerType: "ToPhoneNumber",
      TriggerValue: phoneNumber,
      Disabled: false,
      TargetApplications: [
        {
          SipMediaApplicationId: smaId,
          Priority: 1,
          AwsRegion: process.env.AWS_CHIME_REGION ?? "us-east-1",
        },
      ],
    })
  );

  const sipRuleId = sipRuleResult.SipRule?.SipRuleId;
  if (!sipRuleId) {
    throw new Error("Failed to create SIP rule for Chime phone number");
  }

  // ── Step 6: Persist to diviner record ────────────────────────────────────
  const admin = createAdminClient();
  const { error } = await admin
    .from("diviners")
    .update({
      chime_phone_number: phoneNumber,
      chime_sma_phone_arn: realArn,
      chime_sip_rule_id: sipRuleId,
      phone_provider: "chime",
    })
    .eq("id", divinerId);

  if (error) {
    throw new Error(`Failed to save Chime phone to diviner: ${error.message}`);
  }

  return { phoneNumber, phoneArn: realArn };
}

/**
 * Release a Chime PSTN phone number from a diviner.
 *
 * Steps:
 *   1. Fetch the diviner's stored phone number and SIP rule ID
 *   2. Delete the SIP Rule so inbound routing is removed before the number
 *      goes back to the pool (a number cannot be deleted while a SIP Rule
 *      still references it in some Chime account configurations)
 *   3. Delete the phone number
 *   4. Clear the diviner record
 *
 * Mirrors the Twilio releasePhoneNumber() function.
 */
export async function releaseChimePhoneNumber(
  divinerId: string
): Promise<void> {
  const admin = createAdminClient();

  // Fetch diviner's Chime phone info
  const { data: diviner } = await admin
    .from("diviners")
    .select("chime_phone_number, chime_sma_phone_arn, chime_sip_rule_id")
    .eq("id", divinerId)
    .single();

  if (!diviner?.chime_phone_number) {
    throw new Error("Diviner does not have a Chime phone number");
  }

  const voice = getChimeVoiceClient();

  // ── Step 2: Delete the SIP Rule ──────────────────────────────────────────
  if (diviner.chime_sip_rule_id) {
    try {
      await voice.send(
        new DeleteSipRuleCommand({ SipRuleId: diviner.chime_sip_rule_id })
      );
    } catch (err) {
      // Log but continue — the rule may have been deleted manually
      console.error(
        `Failed to delete Chime SIP rule ${diviner.chime_sip_rule_id}:`,
        err
      );
    }
  }

  // ── Step 3: Delete the phone number ──────────────────────────────────────
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

  // ── Step 4: Clear diviner record ─────────────────────────────────────────
  await admin
    .from("diviners")
    .update({
      chime_phone_number: null,
      chime_sma_phone_arn: null,
      chime_sip_rule_id: null,
    })
    .eq("id", divinerId);
}
