// /api/webhook.js
import { buffer } from "micro";
import Stripe from "stripe";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Only POST allowed");

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
    console.error("❌ Webhook signature invalid:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const customerId = event?.data?.object?.customer;
  if (!customerId) return res.status(400).send("Missing customer ID.");

  const now = new Date();
  const monthKey = `${customerId}_${now.getFullYear()}-${now.getMonth() + 1}`;
  console.log(`⛔️ Revoking access for: ${monthKey}`);

  // ✅ Call Worker to revoke access
  await fetch("https://deal-finder-mcp.mydeals-ai.workers.dev/api/reset-usage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.ADMIN_PASSWORD}`,
    },
    body: JSON.stringify({ customerId, value: "1001" }),
  });

  res.status(200).json({ received: true });
}
