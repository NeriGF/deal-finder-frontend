export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      console.log("🚫 Method not POST:", req.method);
      return res.status(405).json({ error: "Only POST allowed" });
    }

    console.log("🔍 Reading raw body...");
    const raw = await req.text();
    console.log("📦 Raw body string:", raw);

    let body;
    try {
      body = JSON.parse(raw);
    } catch (err) {
      console.error("❌ JSON parse error:", err.message);
      return res.status(400).json({ error: "Invalid JSON" });
    }

    const { customerId } = body;
    const auth = req.headers.authorization;

    console.log("🧾 Parsed values:");
    console.log("customerId:", customerId);
    console.log("Authorization:", auth);

    if (!customerId || !auth) {
      console.log("🚫 Missing values!");
      return res.status(400).json({ error: "Missing customerId or Authorization" });
    }

    console.log("🚀 Sending to reset-usage...");
    const forwardRes = await fetch("https://deal-finder-mcp.mydeals-ai.workers.dev/api/reset-usage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body: JSON.stringify({ customerId }),
    });

    console.log("✅ Forwarded status:", forwardRes.status);
    const data = await forwardRes.text();
    console.log("📨 Response from worker:", data);

    res.status(forwardRes.status).send(data);
  } catch (err) {
    console.error("💥 Proxy failed:", err);
    res.status(500).json({ error: "Proxy failed", detail: err.message });
  }
}
