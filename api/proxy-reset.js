export default async function handler(req, res) {
  const forwardRes = await fetch("https://deal-finder-mcp.mydeals-ai.workers.dev/api/reset-usage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: req.headers.authorization,
    },
    body: JSON.stringify(req.body),
  });

  const result = await forwardRes.json();
  res.status(forwardRes.status).json(result);
}
