const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const customer = await stripe.customers.retrieve(session.customer);

    return res.status(200).json({
      customerId: session.customer,
      email: session.customer_email
    });
  } catch (err) {
    console.error("Lookup session failed:", err.message);
    res.status(500).json({ error: "Failed to lookup session" });
  }
};
