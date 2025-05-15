// /api/list-customers.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  const token = req.headers.authorization;

  if (token !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const customers = await stripe.customers.list({ limit: 100 });
    const subs = await stripe.subscriptions.list({ limit: 100 });

    // map each subscription to a customer ID
    const subMap = {};
    for (const sub of subs.data) {
      if (sub.customer) subMap[sub.customer] = sub;
    }

    const enriched = customers.data.map(cust => ({
      id: cust.id,
      email: cust.email,
      status: subMap[cust.id]?.status || "none",
      current_period_end: subMap[cust.id]?.current_period_end || null,
    }));

    return res.json({ customers: enriched });
  } catch (err) {
    console.error("❌ Error loading customers:", err);
    return res.status(500).json({ error: "Failed to load customers" });
  }
};
