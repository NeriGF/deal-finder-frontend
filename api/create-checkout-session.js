const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  console.log("▶️ Stripe session creation started");

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  console.log("🔒 Loaded STRIPE_SECRET_KEY?", stripeSecretKey ? "Yes" : "No");

  if (!stripeSecretKey) {
    return res.status(500).json({ error: "Missing Stripe secret key in env vars" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Missing email in request body" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
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
    console.error(err); // Full details
    return res.status(500).json({ error: "Server error creating Stripe session" });
  }
};
