export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    // 🛠️ Manually parse raw body (required on Vercel)
    const raw = await req.text();
    let body;
    try {
      body = JSON.parse(raw);
    } catch (err) {
      console.error("❌ JSON parse error:", raw);
      return res.status(400).json({ error: "Invalid JSON" });
    }

    const { customerId } = body;
    const auth = req.headers.authorization;

    // 🧪 Debug
    console.log("🧾 proxy-reset called with:");
    console.log("customerId:", customerId);
    console.log("Authorization:", auth);

    if (!customerId || !auth) {
      return res.status(400).json({ error: "Missing customerId or Authorization" });
    }

    const forwardRes = await fetch("https://deal-finder-mcp.mydeals-ai.workers.dev/api/reset-usage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body: JSON.stringify({ customerId }),
    });

    const data = await forwardRes.text(); // 👈 Not .json() to avoid unexpected crashes

    res.status(forwardRes.status).send(data);
  } catch (err) {
    console.error("❌ proxy-reset failed:", err);
    return res.status(500).json({ error: "Proxy failed" });
  }
}
