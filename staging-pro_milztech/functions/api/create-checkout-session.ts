
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
    
    if (!body) {
      return new Response(JSON.stringify({ message: "Request body is completely empty." }), { status: 400 });
    }

    const { planTitle, amount, orderId, userEmail } = body;
    
    // 詳細なデバッグ用バリデーション
    const missing = [];
    if (amount === undefined || amount === null) missing.push("amount");
    if (!orderId) missing.push("orderId");
    if (!userEmail) missing.push("userEmail");

    if (missing.length > 0) {
      return new Response(JSON.stringify({ 
        message: `SERVER ERROR: Missing parameters: ${missing.join(", ")}`,
        debug_payload: body
      }), { status: 400 });
    }

    // 環境変数のチェック
    if (!env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY === "") {
      return new Response(JSON.stringify({ 
        message: "SERVER ERROR: STRIPE_SECRET_KEY is not defined in Cloudflare environment." 
      }), { status: 500 });
    }

    // 金額の最終確認
    const finalAmount = Math.round(Number(amount));
    if (isNaN(finalAmount) || finalAmount < 50) { // Stripeの最小決済金額は50セント（USD）
      return new Response(JSON.stringify({ message: `Invalid amount: ${amount}` }), { status: 400 });
    }

    // Stripe APIリクエスト
    const stripeParams = new URLSearchParams();
    stripeParams.append("mode", "payment");
    stripeParams.append("customer_email", userEmail);
    stripeParams.append("success_url", `${new URL(request.url).origin}/?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}&payment=success`);
    stripeParams.append("cancel_url", `${new URL(request.url).origin}/`);
    stripeParams.append("line_items[0][price_data][currency]", "usd");
    stripeParams.append("line_items[0][price_data][product_data][name]", `StagingPro: ${planTitle || 'Staging Service'}`);
    stripeParams.append("line_items[0][price_data][unit_amount]", finalAmount.toString());
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
      console.error("Stripe Error Details:", session);
      return new Response(JSON.stringify({ 
        message: session.error?.message || "Failed to create Stripe Checkout URL." 
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
    return new Response(JSON.stringify({ message: `Critical Server Error: ${error.message}` }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
