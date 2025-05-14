import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  const rawBody = await buffer(req); // Use raw-body lib
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // TODO: Unlock access, store customer ID
    console.log("✅ Payment completed:", session.customer);

    // e.g., update Firebase, Supabase, Airtable, etc.
  }

  res.status(200).json({ received: true });
}
