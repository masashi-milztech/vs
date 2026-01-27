
/**
 * Multi-Provider Email Utility for StagingPro
 */

const getEnv = (name: string) => {
  // @ts-ignore
  return (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) || process.env[name];
};

export const RESEND_API_KEY = getEnv('VITE_RESEND_API_KEY');
// ドメイン認証が済むまでは 'onboarding@resend.dev' を使うことも可能
export const EMAIL_FROM = getEnv('VITE_EMAIL_FROM') || 'StagingPro Studio <info@milz.tech>';

export async function sendStudioEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    const errorMsg = "VITE_RESEND_API_KEY が設定されていません。Cloudflareの環境変数を確認してください。";
    console.error(`[Email Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  try {
    console.log(`[Email] Attempting to send to: ${to} via Resend...`);
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[Email Error] Resend API responded with error:", result);
      // ドメイン未認証時の一般的なエラー
      if (result.message?.includes('unverified')) {
        throw new Error("Resendでドメイン(milz.tech)の認証が完了していません。Resend Dashboard > Domainsを確認してください。");
      }
      throw new Error(result.message || 'Resend request failed');
    }

    console.log("[Email Success] ID:", result.id);
    return result;
  } catch (err) {
    console.error("[Email Critical Error]", err);
    throw err;
  }
}

const COMMON_STYLE = `background-color: #F8FAFC; padding: 50px 20px; font-family: sans-serif;`;
const CARD_STYLE = `max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 32px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.05); border: 1px solid #F1F5F9;`;

export const EMAIL_TEMPLATES = {
  ORDER_CONFIRMED: (orderId: string, planName: string) => `
    <div style="${COMMON_STYLE}">
      <div style="${CARD_STYLE}">
        <div style="padding: 60px 50px 40px 50px; text-align: center;">
          <h1 style="margin: 0; font-size: 10px; font-weight: 900; letter-spacing: 5px; color: #94A3B8; text-transform: uppercase; margin-bottom: 20px;">StagingPro Studio</h1>
          <h2 style="margin: 0; font-size: 32px; font-weight: 900; color: #0F172A; letter-spacing: -1px; line-height: 1.2;">ORDER<br/>CONFIRMED</h2>
        </div>
        <div style="padding: 0 60px 60px 60px; text-align: center;">
          <p style="font-size: 16px; color: #64748B; line-height: 1.8; margin-bottom: 40px;">オーダーを承りました。3営業日以内に納品いたします。</p>
          <div style="background: #F8FAFC; padding: 30px; border-radius: 20px; text-align: left; border: 1px solid #F1F5F9;">
            <p style="margin: 0; font-size: 9px; font-weight: 900; color: #94A3B8; text-transform: uppercase;">Order ID: ${orderId}</p>
            <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 700; color: #0F172A;">${planName}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  DELIVERY_READY: (orderId: string) => `
    <div style="${COMMON_STYLE}">
      <div style="${CARD_STYLE}">
        <div style="padding: 60px 50px 40px 50px; text-align: center;">
          <h1 style="margin: 0; font-size: 10px; font-weight: 900; letter-spacing: 5px; color: #94A3B8; text-transform: uppercase; margin-bottom: 20px;">StagingPro Studio</h1>
          <h2 style="margin: 0; font-size: 32px; font-weight: 900; color: #0F172A; letter-spacing: -1px; line-height: 1.2;">DELIVERY<br/>READY</h2>
        </div>
        <div style="padding: 0 60px 60px 60px; text-align: center;">
          <p style="font-size: 16px; color: #64748B; line-height: 1.8; margin-bottom: 40px;">ビジュアライゼーションが完了しました。アーカイブをご確認ください。</p>
          <a href="https://milz.tech" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; padding: 22px 50px; border-radius: 20px; font-size: 12px; font-weight: 900; text-decoration: none; text-transform: uppercase;">View Archive</a>
        </div>
      </div>
    </div>
  `
};
