const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

interface SendSMSParams {
  to: string;
  body: string;
}

export async function sendSMS({ to, body }: SendSMSParams) {
  // Placeholder: log instead of sending in development
  if (
    !TWILIO_ACCOUNT_SID ||
    TWILIO_ACCOUNT_SID === "placeholder" ||
    !TWILIO_AUTH_TOKEN ||
    TWILIO_AUTH_TOKEN === "placeholder"
  ) {
    console.log("[SMS] Would send SMS:", { to, body });
    return { success: true, sid: "dev-placeholder" };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString(
          "base64"
        ),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: to,
      From: TWILIO_PHONE_NUMBER ?? "+1234567890",
      Body: body,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("[SMS] Failed to send:", error);
    throw new Error(`Failed to send SMS: ${error}`);
  }

  const data = await res.json();
  return { success: true, sid: data.sid };
}
