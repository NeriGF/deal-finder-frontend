const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: 'price_1RNRw6RVExZCuSNIoVn3EBjv',
          quantity: 1,
        },
      ],
      success_url: 'https://deal-finder-frontend.vercel.app/?success=true',
      cancel_url: 'https://deal-finder-frontend.vercel.app/?canceled=true',
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (err) {
    console.error('❌ Stripe server error:', err);
    return res.status(500).json({ error: 'Server error creating Stripe session' });
  }
}
