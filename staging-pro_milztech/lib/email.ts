
/**
 * Multi-Provider Email Utility for StagingPro (Server-Relay version)
 */

export const EMAIL_FROM = 'StagingPro Studio <info@milz.tech>';

const getEnv = (name: string) => {
  // @ts-ignore
  return (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) || process.env[name];
};

export const RESEND_API_KEY = getEnv('VITE_RESEND_API_KEY');

export async function sendStudioEmail(to: string, subject: string, html: string) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject: subject,
        html: html,
      }),
    });
    return await response.json();
  } catch (err: any) {
    console.error("[Email Critical Error]", err);
    throw err;
  }
}

const STYLE = {
  container: `background-color: #FFFFFF; padding: 40px 20px; font-family: 'Inter', -apple-system, sans-serif; color: #0F172A;`,
  card: `max-width: 540px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #F1F5F9; border-radius: 40px; overflow: hidden; box-shadow: 0 40px 80px rgba(0,0,0,0.03);`,
  header: `padding: 60px 40px 40px 40px; text-align: center;`,
  title: `margin: 0; font-size: 10px; font-weight: 900; letter-spacing: 6px; color: #94A3B8; text-transform: uppercase; margin-bottom: 16px;`,
  heading: `margin: 0; font-size: 36px; font-weight: 900; color: #0F172A; letter-spacing: -2px; line-height: 1.1;`,
  body: `padding: 0 40px 60px 40px;`,
  thumbnailContainer: `width: 100%; aspect-ratio: 16/9; background-color: #F8FAFC; border-radius: 24px; overflow: hidden; margin-bottom: 40px; border: 1px solid #F1F5F9;`,
  thumbnail: `width: 100%; height: 100%; object-fit: cover; display: block;`,
  infoGrid: `background: #F8FAFC; border-radius: 28px; padding: 32px; border: 1px solid #F1F5F9;`,
  infoRow: `display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid #E2E8F0; padding-bottom: 16px;`,
  label: `font-size: 9px; font-weight: 900; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; margin: 0;`,
  value: `font-size: 13px; font-weight: 700; color: #0F172A; text-align: right; margin: 0;`,
  button: `display: block; width: 100%; background-color: #0F172A; color: #FFFFFF; padding: 24px; border-radius: 24px; text-align: center; font-size: 12px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 3px; margin-top: 40px;`
};

export const EMAIL_TEMPLATES = {
  ORDER_CONFIRMED: (data: { 
    orderId: string, 
    planName: string, 
    price: string, 
    date: string, 
    delivery: string, 
    thumbnail: string 
  }) => `
    <div style="${STYLE.container}">
      <div style="${STYLE.card}">
        <div style="${STYLE.header}">
          <p style="${STYLE.title}">StagingPro Studio</p>
          <h2 style="${STYLE.heading}">ORDER<br/>CONFIRMED</h2>
        </div>
        <div style="${STYLE.body}">
          <div style="${STYLE.thumbnailContainer}">
            <img src="${data.thumbnail}" style="${STYLE.thumbnail}" alt="Project View" />
          </div>
          <div style="${STYLE.infoGrid}">
            <div style="${STYLE.infoRow}">
              <p style="${STYLE.label}">Project ID</p>
              <p style="${STYLE.value}">${data.orderId}</p>
            </div>
            <div style="${STYLE.infoRow}">
              <p style="${STYLE.label}">Service</p>
              <p style="${STYLE.value}">${data.planName}</p>
            </div>
            <div style="${STYLE.infoRow}">
              <p style="${STYLE.label}">Total Amount</p>
              <p style="${STYLE.value}">${data.price}</p>
            </div>
            <div style="${STYLE.infoRow}">
              <p style="${STYLE.label}">Ordered At</p>
              <p style="${STYLE.value}">${data.date}</p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <p style="${STYLE.label}">Est. Delivery</p>
              <p style="${STYLE.value}">${data.delivery}</p>
            </div>
          </div>
          <p style="text-align: center; font-size: 11px; color: #94A3B8; margin-top: 40px; font-weight: 500; line-height: 1.6;">
            Our architectural visualizers have begun processing your assets.<br/>
            You will receive another notification once the delivery is ready.
          </p>
        </div>
      </div>
    </div>
  `,
  DELIVERY_READY: (data: { 
    orderId: string, 
    thumbnail: string,
    resultUrl: string
  }) => `
    <div style="${STYLE.container}">
      <div style="${STYLE.card}">
        <div style="${STYLE.header}">
          <p style="${STYLE.title}">StagingPro Studio</p>
          <h2 style="${STYLE.heading}">DELIVERY<br/>READY</h2>
        </div>
        <div style="${STYLE.body}">
          <div style="${STYLE.thumbnailContainer}">
            <img src="${data.thumbnail}" style="${STYLE.thumbnail}" alt="Staged Result" />
          </div>
          <div style="${STYLE.infoGrid}">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <p style="${STYLE.label}">Project ID</p>
              <p style="${STYLE.value}">${data.orderId}</p>
            </div>
          </div>
          <a href="${data.resultUrl || 'https://milz.tech'}" style="${STYLE.button}">View Deliverables</a>
          <p style="text-align: center; font-size: 11px; color: #94A3B8; margin-top: 40px; font-weight: 500; line-height: 1.6;">
            The visualization for your space is now complete.<br/>
            High-resolution assets are available in your studio archive.
          </p>
        </div>
      </div>
    </div>
  `
};
