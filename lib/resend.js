// lib/resend.js
//
// Lazily creates the Resend client only when actually sending an
// email, instead of at module load time. This prevents a missing
// RESEND_API_KEY from crashing the entire build/deploy — it now just
// fails that one send attempt with a clear log message instead.

import { Resend } from "resend";

let resendClient = null;

function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Geniuz Prediction <payments@geniuzprediction.com>";

export async function sendEmail({ to, subject, html }) {
  const client = getResendClient();
  if (!client) {
    console.error("Resend email skipped: RESEND_API_KEY is not set");
    return { success: false, error: "RESEND_API_KEY is not set" };
  }

  try {
    const result = await client.emails.send({ from: FROM_EMAIL, to, subject, html });
    return { success: true, result };
  } catch (err) {
    console.error("Resend email error:", err);
    return { success: false, error: err.message };
  }
}
