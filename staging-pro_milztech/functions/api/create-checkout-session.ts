
interface Env {
  STRIPE_SECRET_KEY: string;
}

export const onRequest = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method Not Allowed" }), { 
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await request.json() as any;
    const { planTitle, amount, orderId, userEmail } = body;
    
    // デバッグログ (Cloudflareのログで確認可能)
    console.log("Checkout Request Payload:", body);

    // 環境変数のチェック
    if (!env.STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({ 
        message: "Stripe configuration missing on server. Please set STRIPE_SECRET_KEY." 
      }), { status: 500 });
    }

    // 必須パラメータのチェック
    if (!amount || !orderId || !userEmail) {
      return new Response(JSON.stringify({ 
        message: `Missing required parameters: ${!amount ? 'amount ' : ''}${!orderId ? 'orderId ' : ''}${!userEmail ? 'userEmail' : ''}`
      }), { status: 400 });
    }

    // Stripe APIリクエスト (USD決済)
    // 数値は必ず文字列に変換して渡す
    const stripeParams = new URLSearchParams();
    stripeParams.append("mode", "payment");
    stripeParams.append("customer_email", userEmail);
    stripeParams.append("success_url", `${new URL(request.url).origin}/?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}&payment=success`);
    stripeParams.append("cancel_url", `${new URL(request.url).origin}/`);
    stripeParams.append("line_items[0][price_data][currency]", "usd");
    stripeParams.append("line_items[0][price_data][product_data][name]", `StagingPro: ${planTitle || 'Staging Service'}`);
    stripeParams.append("line_items[0][price_data][unit_amount]", Math.round(Number(amount)).toString());
    stripeParams.append("line_items[0][quantity]", "1");
    stripeParams.append("metadata[orderId]", orderId);
    stripeParams.append("payment_method_types[0]", "card");

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: stripeParams.toString(),
    });

    const session = await response.json() as any;

    if (!session.url) {
      console.error("Stripe API Error Response:", session);
      return new Response(JSON.stringify({ 
        message: session.error?.message || "Stripe session creation failed." 
      }), { status: 500 });
    }

    return new Response(JSON.stringify({ url: session.url, id: session.id }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return new Response(JSON.stringify({ message: error.message || "Internal server error during checkout session creation." }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
