const stripe = require('stripe')('sk_test_51RNRl1RVExZCuSNIFflHbkyPdlZFUtkHgWznXjEQBchEz1mmG5GOhn0pYCxZW7Tfq2soIKXIswtfnzTgPrcCK7FU0061si9r4R'); // 🔁 Replace with your **SECRET** Stripe key

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'Only POST allowed' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: 'cus_SIgjQLDNFpPIQn', // 🔁 Replace with a real Stripe Price ID from your dashboard
          quantity: 1,
        },
      ],
      success_url: 'https://deal-finder-frontend.vercel.app/?success=true',
      cancel_url: 'https://deal-finder-frontend.vercel.app/?canceled=true',
    });

    res.status(200).json({ sessionId: session.id });
  } catch (err) {
    console.error('❌ Stripe error:', err);
    res.status(500).json({ error: 'Server error creating Stripe session' });
  }
};
