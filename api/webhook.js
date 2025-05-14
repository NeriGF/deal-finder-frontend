// import Stripe from 'stripe';
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// export default async function handler(req, res) {
//   const sig = req.headers['stripe-signature'];
//   const rawBody = await buffer(req); // Use raw-body lib
//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(
//       rawBody,
//       sig,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//   } catch (err) {
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   if (event.type === 'checkout.session.completed') {
//     const session = event.data.object;

//     // TODO: Unlock access, store customer ID
//     console.log("✅ Payment completed:", session.customer);

//     // e.g., update Firebase, Supabase, Airtable, etc.
//   }

//   res.status(200).json({ received: true });
// }


const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Handle subscription success
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    console.log("🎉 Subscription complete:", session.id);
    console.log("📧 Customer email:", session.customer_email);
    console.log("👤 Stripe customer ID:", session.customer);

    // TODO: Save this to your database or localStorage
    // e.g., map session.customer_email → session.customer
  }

  res.status(200).json({ received: true });
};

// Needed to parse raw body for Stripe
const getRawBody = require("raw-body");
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
