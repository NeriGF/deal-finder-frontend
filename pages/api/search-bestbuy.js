module.exports = async (req, res) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Support both body (POST) and query parameters (GET)
  const query = req.body?.query || req.query?.query || "";
  const source = "bestbuy";

  const apiKey = process.env.BESTBUY_API_KEY;

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
    // Search using Best Buy Products API
    // Search query syntax for Best Buy is products(search=...)
    const searchUrl = `https://api.bestbuy.com/v1/products(search=${encodeURIComponent(query)})?apiKey=${apiKey}&format=json&pageSize=10`;
    const searchResponse = await fetch(searchUrl, { method: "GET" });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("❌ Best Buy search failed:", errorText);
      return res.status(200).json({
        results: [],
        source,
        error: `Search failed: ${searchResponse.statusText}`
      });
    }

    const searchData = await searchResponse.json();
    const items = searchData.products || [];

    // Normalize search results
    const results = items.map(product => {
      const priceVal = parseFloat(product.salePrice || product.regularPrice);
      const ratingVal = product.customerReviewAverage ? parseFloat(product.customerReviewAverage) : null;
      const reviewCountVal = product.customerReviewCount ? parseInt(product.customerReviewCount) : 0;

      return {
        title: product.name,
        price: priceVal !== null && !isNaN(priceVal) ? priceVal : (product.salePrice || "N/A"),
        currency: "USD",
        url: product.url,
        image: product.image || product.largeFrontImage || product.mediumImage || "",
        source: "Best Buy",
        rating: ratingVal,
        reviewCount: reviewCountVal,
        availability: product.onlineAvailability ? "In Stock" : "Out of Stock",
        shipping: product.freeShipping ? "Free Shipping" : "Standard Shipping",
        score: ratingVal ? Math.round(ratingVal * 20) : 80
      };
    });

    console.log(`Best Buy: ${results.length}`);

    return res.status(200).json({
      results,
      source
    });

  } catch (err) {
    console.error("❌ Best Buy Search Route error:", err.message);
    return res.status(200).json({
      results: [],
      source,
      error: `Internal server error: ${err.message}`
    });
  }
};
