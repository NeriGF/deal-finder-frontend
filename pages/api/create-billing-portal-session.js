const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { customerId } = req.body;

  if (!customerId || !customerId.startsWith("cus_")) {
    console.error("❌ Invalid or missing customerId:", customerId);
    return res.status(400).json({ error: "Missing or invalid customerId" });
  }

  try {
    // Optional: Confirm the customer exists
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer || customer.deleted) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: "https://deal-finder-frontend.vercel.app",
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("❌ Stripe error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
