module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query, deals } = req.body || {};
  const apiKey = process.env.OPENAI_API_KEY;

  // 1. Add helpful debugging: count and log provider results in the backend console
  const safeDeals = Array.isArray(deals) ? deals : [];
  
  const counts = {
    Amazon: 0,
    Walmart: 0,
    eBay: 0,
    "Best Buy": 0,
    "Google Shopping": 0,
    "Local Services": 0
  };

  safeDeals.forEach(d => {
    const src = (d.source || "").toLowerCase();
    if (src.includes("amazon")) {
      counts.Amazon++;
    } else if (src.includes("walmart")) {
      counts.Walmart++;
    } else if (src.includes("ebay")) {
      counts.eBay++;
    } else if (src.includes("best buy")) {
      counts["Best Buy"]++;
    } else if (src.includes("google")) {
      counts["Google Shopping"]++;
    } else if (src.includes("local") || src.includes("yelp")) {
      counts["Local Services"]++;
    }
  });

  console.log("=== Provider Result Counts ===");
  console.log("Amazon:", counts.Amazon);
  console.log("Walmart:", counts.Walmart);
  console.log("eBay:", counts.eBay);
  console.log("Best Buy:", counts["Best Buy"]);
  console.log("Google Shopping:", counts["Google Shopping"]);
  console.log("Local Services:", counts["Local Services"]);
  console.log("==============================");

  // 2. Check if OPENAI_API_KEY exists
  if (!apiKey) {
    return res.status(200).json({
      enabled: false,
      summary: "AI summary unavailable because OPENAI_API_KEY is missing."
    });
  }

  if (safeDeals.length === 0) {
    return res.status(200).json({
      enabled: true,
      summary: "No deals available to rank. Try searching for a different product."
    });
  }

  try {
    const systemPrompt = `You are a Deal Finder AI assistant. Your goal is to analyze product deals from different sources, rank them, and summarize them.
You must return your output ONLY as a valid JSON object matching the following structure:
{
  "bestDeal": {
    "title": "product title",
    "price": "price",
    "source": "store source",
    "url": "link",
    "reason": "why this is the best value/deal based on ratings and review count"
  },
  "cheapestDeal": {
    "title": "product title",
    "price": "price",
    "source": "store source",
    "url": "link",
    "reason": "why this is the cheapest option"
  },
  "avoid": [
    {
      "title": "product title",
      "source": "store source",
      "reason": "why this looks unrelated or bad value"
    }
  ],
  "summary": "AI summary explaining which result is cheapest, which is best value, which results look unrelated, and what store/source each deal came from."
}
No other text, markdown formatting, or explanation outside the JSON is allowed. It must be a raw JSON string.`;

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Query: ${query}\nDeals: ${JSON.stringify(safeDeals.slice(0, 15))}` }
        ],
        temperature: 0.2
      })
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      console.error("❌ OpenAI API failed:", errorText);
      return res.status(200).json({
        enabled: false,
        summary: `AI ranking failed: ${openAiResponse.statusText}`
      });
    }

    const openAiData = await openAiResponse.json();
    const aiText = openAiData.choices?.[0]?.message?.content;
    const parsed = JSON.parse(aiText);

    return res.status(200).json({
      enabled: true,
      bestDeal: parsed.bestDeal,
      cheapestDeal: parsed.cheapestDeal,
      avoid: parsed.avoid || [],
      summary: parsed.summary
    });

  } catch (err) {
    console.error("❌ AI Deal Ranker error:", err.message);
    return res.status(200).json({
      enabled: false,
      summary: `AI ranker error: ${err.message}`
    });
  }
};
