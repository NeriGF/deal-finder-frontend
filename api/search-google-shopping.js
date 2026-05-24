module.exports = async (req, res) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Support both body (POST) and query parameters (GET)
  const query = req.body?.query || req.query?.query || "";
  const source = "google-shopping";

  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    return res.status(200).json({
      results: [],
      source,
      skipped: true,
      reason: "Missing API key"
    });
  }

  if (!query) {
    return res.status(200).json({
      results: [],
      source,
      error: "Missing query"
    });
  }

  try {
    // Search using SerpAPI Google Shopping
    const searchUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${apiKey}`;
    const searchResponse = await fetch(searchUrl, { method: "GET" });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("❌ Google Shopping (SerpAPI) search failed:", errorText);
      return res.status(200).json({
        results: [],
        source,
        error: `Search failed: ${searchResponse.statusText}`
      });
    }

    const searchData = await searchResponse.json();
    const items = searchData.shopping_results || [];

    // Normalize search results
    const results = items.map(item => {
      const parsedPrice = item.price ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : null;
      const ratingVal = item.rating ? parseFloat(item.rating) : null;
      const reviewCountVal = item.reviews ? parseInt(item.reviews) : 0;

      return {
        title: item.title,
        price: parsedPrice !== null && !isNaN(parsedPrice) ? parsedPrice : (item.price || "N/A"),
        currency: "USD",
        url: item.link,
        image: item.thumbnail || "",
        source: "Google Shopping",
        rating: ratingVal,
        reviewCount: reviewCountVal,
        availability: "In Stock", // Default for SerpAPI shopping results
        shipping: item.delivery || "Calculated Shipping",
        score: ratingVal ? Math.round(ratingVal * 20) : 80
      };
    });

    console.log(`Google Shopping: ${results.length}`);

    return res.status(200).json({
      results,
      source
    });

  } catch (err) {
    console.error("❌ Google Shopping Search Route error:", err.message);
    return res.status(200).json({
      results: [],
      source,
      error: `Internal server error: ${err.message}`
    });
  }
};
