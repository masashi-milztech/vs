
interface Env {
  STRIPE_SECRET_KEY: string;
}

export const onRequest = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method Not Allowed" }), { status: 405 });
  }

  try {
    const { planTitle, amount, orderId, userEmail } = await request.json();
    
    // 環境変数のチェック
    if (!env.STRIPE_SECRET_KEY) {
      console.error("Missing STRIPE_SECRET_KEY in Cloudflare Environment Variables");
      return new Response(JSON.stringify({ 
        message: "Stripe configuration missing. Please set STRIPE_SECRET_KEY in Cloudflare dashboard." 
      }), { status: 500 });
    }

    // Stripe APIリクエスト (USD決済)
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "mode": "payment",
        "customer_email": userEmail,
        "success_url": `${new URL(request.url).origin}/?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}&payment=success`,
        "cancel_url": `${new URL(request.url).origin}/`,
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][product_data][name]": `StagingPro: ${planTitle}`,
        "line_items[0][price_data][unit_amount]": amount.toString(),
        "line_items[0][quantity]": "1",
        "metadata[orderId]": orderId,
        "payment_method_types[]": "card",
      }).toString(),
    });

    const session = await response.json() as any;

    if (!session.url) {
      console.error("Stripe Error Details:", session);
      throw new Error(session.error?.message || "Stripe Session Creation Failed");
    }

    return new Response(JSON.stringify({ url: session.url, id: session.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Stripe Function Error:", error);
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};
