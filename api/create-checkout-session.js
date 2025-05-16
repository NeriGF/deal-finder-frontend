module.exports = async (req, res) => {
  console.log("▶️ Stripe session creation started");

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return res.status(500).json({ error: "Missing Stripe secret key in env vars" });
  }

  const stripe = require('stripe')(stripeSecretKey);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { email } = req.body;
  console.log("📨 Incoming body:", req.body);

  if (!email) {
    return res.status(400).json({ error: "Missing email in request body" });
  }

  try {
    // 🔁 Create or reuse Stripe customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0] || await stripe.customers.create({ email });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id, // ✅ Persistent Stripe customer
      line_items: [
        {
          price: "price_1RNRw6RVExZCuSNIoVn3EBjv",
          quantity: 1,
        },
      ],
      success_url: "https://deal-finder-frontend.vercel.app/success.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://deal-finder-frontend.vercel.app/?canceled=true",
    });

    console.log("✅ Created session:", session.id);
    return res.status(200).json({ sessionId: session.id });

  } catch (err) {
    console.error("❌ Stripe server error:", err.message);
    return res.status(500).json({ error: "Server error creating Stripe session" });
  }
};
