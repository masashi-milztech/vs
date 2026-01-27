
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

const COMMON_STYLE = `
  background-color: #F8FAFC; 
  padding: 50px 20px; 
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
`;

const CARD_STYLE = `
  max-width: 600px; 
  margin: 0 auto; 
  background-color: #FFFFFF; 
  border-radius: 32px; 
  overflow: hidden; 
  box-shadow: 0 20px 50px rgba(0,0,0,0.05); 
  border: 1px solid #F1F5F9;
`;

export const EMAIL_TEMPLATES = {
  ORDER_CONFIRMED: (orderId: string, planName: string) => `
    <div style="${COMMON_STYLE}">
      <div style="${CARD_STYLE}">
        <div style="padding: 60px 50px 40px 50px; text-align: center;">
          <h1 style="margin: 0; font-size: 10px; font-weight: 900; letter-spacing: 5px; color: #94A3B8; text-transform: uppercase; margin-bottom: 20px;">StagingPro Studio</h1>
          <h2 style="margin: 0; font-size: 32px; font-weight: 900; color: #0F172A; letter-spacing: -1px; line-height: 1.2;">ORDER<br/>CONFIRMED</h2>
        </div>
        <div style="padding: 0 60px 60px 60px; text-align: center;">
          <p style="font-size: 16px; color: #64748B; line-height: 1.8; margin-bottom: 40px;">
            オーダーを承りました。StagingProのビジュアライザーが、あなたの空間資産の最適化を開始します。
          </p>
          <div style="background: #F8FAFC; padding: 30px; border-radius: 20px; margin-bottom: 40px; text-align: left; border: 1px solid #F1F5F9;">
            <p style="margin: 0 0 5px 0; font-size: 9px; font-weight: 900; color: #94A3B8; text-transform: uppercase; letter-spacing: 2px;">Order ID</p>
            <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: 900; color: #0F172A;">${orderId}</p>
            <p style="margin: 0 0 5px 0; font-size: 9px; font-weight: 900; color: #94A3B8; text-transform: uppercase; letter-spacing: 2px;">Strategy</p>
            <p style="margin: 0; font-size: 16px; font-weight: 700; color: #0F172A;">${planName}</p>
          </div>
          <p style="font-size: 13px; color: #94A3B8; line-height: 1.6;">
            制作が完了次第、改めて通知いたします。<br/>
            納品までの目安は3営業日以内です。
          </p>
        </div>
        <div style="background-color: #F8FAFC; padding: 30px; text-align: center; border-top: 1px solid #F1F5F9;">
          <p style="margin: 0; font-size: 9px; font-weight: 800; color: #CBD5E1; letter-spacing: 2px; text-transform: uppercase;">&copy; StagingPro International Studio</p>
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
          <p style="font-size: 16px; color: #64748B; line-height: 1.8; margin-bottom: 40px;">
            ビジュアライゼーションが完了しました。<br/>
            最高品質のステージング資産がアーカイブにアップロードされています。
          </p>
          <div style="background: #F8FAFC; padding: 30px; border-radius: 20px; margin-bottom: 40px; text-align: center; border: 1px solid #F1F5F9;">
            <p style="margin: 0 0 5px 0; font-size: 9px; font-weight: 900; color: #94A3B8; text-transform: uppercase; letter-spacing: 2px;">Project ID</p>
            <p style="margin: 0; font-size: 18px; font-weight: 900; color: #0F172A;">${orderId}</p>
          </div>
          <a href="https://milz.tech" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; padding: 22px 50px; border-radius: 20px; font-size: 12px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 3px; box-shadow: 0 15px 30px rgba(15, 23, 42, 0.2);">
            View Studio Archive
          </a>
        </div>
        <div style="background-color: #F8FAFC; padding: 30px; text-align: center; border-top: 1px solid #F1F5F9;">
          <p style="margin: 0; font-size: 9px; font-weight: 800; color: #CBD5E1; letter-spacing: 2px; text-transform: uppercase;">&copy; StagingPro International Studio</p>
        </div>
      </div>
    </div>
  `
};
