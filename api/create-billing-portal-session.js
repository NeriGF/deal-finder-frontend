const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  const { customerId } = req.body;

  if (!customerId || !customerId.startsWith("cus_")) {
    return res.status(400).json({ error: "Missing or invalid customer ID" });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: "https://deal-finder-frontend.vercel.app",
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("❌ Billing portal creation failed:", err.message);
    return res.status(500).json({ error: "Failed to create billing portal session" });
  }
};
