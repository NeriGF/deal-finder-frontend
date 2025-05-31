const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  const { userKey } = req.body;

  if (!userKey || !userKey.startsWith("cus_")) {
    return res.status(400).json({ valid: false, error: "Invalid or missing customer ID" });
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: userKey,
      status: 'active',
      expand: ['data.default_payment_method']
    });

    if (subscriptions.data.length > 0) {
      return res.status(200).json({ valid: true });
    } else {
      return res.status(200).json({ valid: false, error: "No active subscription" });
    }

  } catch (err) {
    console.error("❌ Stripe error:", err.message);
    return res.status(500).json({ valid: false, error: "Server error" });
  }
};
