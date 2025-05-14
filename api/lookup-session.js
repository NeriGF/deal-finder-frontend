const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  const { sessionId } = req.body;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return res.status(200).json({
      email: session.customer_email,
      customerId: session.customer,
    });
  } catch (err) {
    console.error("❌ Failed to retrieve session:", err.message);
    return res.status(500).json({ error: "Failed to retrieve session" });
  }
};
