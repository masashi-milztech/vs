
/**
 * Multi-Provider Email Utility for StagingPro
 */

const getEnv = (name: string) => {
  // @ts-ignore
  return (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) || process.env[name];
};

export const RESEND_API_KEY = getEnv('VITE_RESEND_API_KEY');

export async function sendStudioEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    const errorMsg = "VITE_RESEND_API_KEY is missing in Cloudflare Environment Variables.";
    console.error(`[Email] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  try {
    const fromEmail = 'StagingPro Studio <info@milz.tech>';
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[Email] Resend API error:", result);
      throw new Error(result.message || 'Resend request failed');
    }

    console.log("[Email] Sent successfully:", result.id);
    return result;
  } catch (err) {
    console.error("[Email] Critical send error:", err);
    throw err;
  }
}

export const EMAIL_TEMPLATES = {
  ORDER_CONFIRMED: (orderId: string, planName: string) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px;">
      <h1 style="font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; color: #0F172A;">Order Confirmed</h1>
      <p style="color: #475569;">Thank you for choosing StagingPro Studio.</p>
      <div style="background: #f8fafc; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Order ID</p>
        <p style="margin: 4px 0 16px 0; font-weight: 800; color: #0F172A; font-size: 18px;">${orderId}</p>
        <p style="margin: 0; font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Strategy</p>
        <p style="margin: 4px 0 0 0; font-weight: 700; color: #0F172A;">${planName}</p>
      </div>
      <p style="font-size: 14px; color: #64748b; line-height: 1.6;">Our visualizers are now processing your spatial assets.</p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
      <p style="font-size: 10px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">&copy; StagingPro International Studio</p>
    </div>
  `,
  DELIVERY_READY: (orderId: string) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px;">
      <h1 style="font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; color: #0F172A;">Results Ready for Review</h1>
      <p style="color: #475569;">Your architectural visualization is now complete.</p>
      <div style="background: #f8fafc; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Project ID</p>
        <p style="margin: 4px 0 0 0; font-weight: 800; color: #0F172A; font-size: 18px;">${orderId}</p>
      </div>
      <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 32px;">The final staging assets have been uploaded to your secure studio archive.</p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 40px 0;" />
      <p style="font-size: 10px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">&copy; StagingPro International Studio</p>
    </div>
  `
};
