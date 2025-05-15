export const config = {
  bodyParser: false,
};

import Stripe from "stripe";
import { buffer } from "micro";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const rawBody = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const allowedEvents = [
    "customer.subscription.deleted",
    "invoice.payment_failed"
  ];

  // 💬 Log the full event for debugging (remove later)
  console.log("📦 Incoming Stripe Event:", JSON.stringify(event, null, 2));

  if (allowedEvents.includes(event.type)) {
    const customerId = event?.data?.object?.customer;

    if (!customerId) {
      console.error("❌ No customer ID found in event:", JSON.stringify(event, null, 2));
      return res.status(400).send("Missing customer ID.");
    }

    const now = new Date();
    const monthKey = `${customerId}_${now.getFullYear()}-${now.getMonth() + 1}`;

    console.log(`⛔️ Revoking access for ${customerId}`);

    try {
      await env.USAGE_KV.put(monthKey, "1001");
    } catch (err) {
      console.error("❌ Failed to update USAGE_KV:", err.message);
      return res.status(500).send("Internal server error while updating usage.");
    }
  }

  return res.json({ received: true });
};
