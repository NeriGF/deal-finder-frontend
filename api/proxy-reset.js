export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  // ✅ Manual JSON parsing to support Edge functions or raw requests
  const raw = await req.text();
  let body;
  try {
    body = JSON.parse(raw);
  } catch (e) {
    console.error("❌ Invalid JSON body:", raw);
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const { customerId } = body;
  const auth = req.headers.authorization;

  console.log("🧾 Forwarding proxy-reset call with:");
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

  const result = await forwardRes.json();
  res.status(forwardRes.status).json(result);
}
