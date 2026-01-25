
/**
 * Resend API Utility for milz.tech
 */

// @ts-ignore - Fix for 'Property env does not exist on type ImportMeta'
const RESEND_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_RESEND_API_KEY) || process.env.VITE_RESEND_API_KEY;

export async function sendStudioEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn("[Email] Skipping send: VITE_RESEND_API_KEY not set.");
    return;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'StagingPro Studio <studio@milz.tech>',
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send email');
    }

    return await response.json();
  } catch (err) {
    console.error("[Email] Send Error:", err);
    throw err;
  }
}

export const EMAIL_TEMPLATES = {
  ORDER_CONFIRMED: (orderId: string, planName: string) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px;">
      <h1 style="font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px;">Order Confirmed</h1>
      <p>Thank you for choosing StagingPro Studio.</p>
      <div style="background: #f9f9f9; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase;">Order ID</p>
        <p style="margin: 5px 0 15px 0; font-weight: bold;">${orderId}</p>
        <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase;">Selected Plan</p>
        <p style="margin: 5px 0 0 0; font-weight: bold;">${planName}</p>
      </div>
      <p style="font-size: 14px; color: #666; line-height: 1.6;">Our visualizers are now processing your spatial assets. You will receive an update once the first draft is ready for review.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 1px;">&copy; StagingPro International Studio</p>
    </div>
  `
};
