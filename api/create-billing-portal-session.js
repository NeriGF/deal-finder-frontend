const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  const { customerId } = req.body;

  if (!customerId || !customerId.startsWith("cus_")) {
    return res.status(400).json({ error: "Invalid or missing customer ID" });
  }

  try {
    // Validate customer exists before proceeding
    await stripe.customers.retrieve(customerId);

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: "https://deal-finder-frontend.vercel.app"
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error("❌ Billing portal error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
