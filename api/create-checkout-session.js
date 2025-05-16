const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  console.log("▶️ Stripe session creation started");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Missing email in request body" });
  }

  try {
    // 🔁 Create or reuse Stripe customer
    const existing = await stripe.customers.list({ email, limit: 1 });
    const customer = existing.data[0] || await stripe.customers.create({ email });

    // 🧾 Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      line_items: [
        {
          price: "price_1RNRw6RVExZCuSNIoVn3EBjv",
          quantity: 1,
        },
      ],
      success_url: "https://deal-finder-frontend.vercel.app/success.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://deal-finder-frontend.vercel.app/?canceled=true",
    });

    console.log("✅ Stripe session created:", session.id);
    return res.status(200).json({ sessionId: session.id });
  } catch (err) {
    console.error("❌ Error creating Stripe session:", err.message);
    return res.status(500).json({ error: "Server error creating Stripe session" });
  }
};
