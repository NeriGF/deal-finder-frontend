export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { customerId } = req.body;
  const auth = req.headers.authorization;

  console.log("🛠️ Forwarding proxy-reset call with:");
  console.log("customerId:", customerId);
  console.log("Authorization:", auth);

  if (!customerId || !auth) {
    return res.status(400).json({ error: "Missing customerId or Authorization" });
  }

  try {
    const forwardRes = await fetch("https://deal-finder-mcp.mydeals-ai.workers.dev/api/reset-usage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body: JSON.stringify({ customerId }),
    });

    const text = await forwardRes.text(); // 🔍 Parse as text to catch all errors
    console.log("🧾 Raw response text from Worker:", text);

    res.status(forwardRes.status).send(text); // 💡 Don't assume JSON, send raw
  } catch (err) {
    console.error("❌ Error in proxy-reset:", err);
    res.status(500).json({ error: "Proxy failed." });
  }
}
