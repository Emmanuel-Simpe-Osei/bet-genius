// lib/resend.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Geniuz Prediction <payments@geniuzprediction.com>";

export async function sendEmail({ to, subject, html }) {
  try {
    const result = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    return { success: true, result };
  } catch (err) {
    console.error("Resend email error:", err);
    return { success: false, error: err.message };
  }
}
