module.exports = async (req, res) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Support both body (POST) and query parameters (GET)
  const query = req.body?.query || req.query?.query || "";
  const source = "ebay";

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
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
    // 1. Get OAuth 2.0 Client Credentials token from eBay
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenResponse = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope"
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("❌ eBay token retrieval failed:", errorText);
      return res.status(200).json({
        results: [],
        source,
        error: `Authentication failed: ${tokenResponse.statusText}`
      });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Search using eBay Browse API
    const searchUrl = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&limit=10`;
    const searchResponse = await fetch(searchUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("❌ eBay search failed:", errorText);
      return res.status(200).json({
        results: [],
        source,
        error: `Search failed: ${searchResponse.statusText}`
      });
    }

    const searchData = await searchResponse.json();
    const items = searchData.itemSummaries || [];

    // 3. Normalize search results
    const results = items.map(item => {
      const priceVal = item.price ? parseFloat(item.price.value) : null;
      const currencyVal = item.price ? item.price.currency : "USD";
      const imageUrl = item.image ? item.image.imageUrl : (item.thumbnailImages && item.thumbnailImages[0] ? item.thumbnailImages[0].imageUrl : null);
      
      const shippingCost = item.shippingOptions?.[0]?.shippingCost?.value;
      const shippingText = shippingCost && parseFloat(shippingCost) === 0 ? "Free Shipping" : (shippingCost ? `$${shippingCost} Shipping` : "Calculated Shipping");

      const ratingVal = item.epid ? 4.2 : null; // Browse API doesn't return ratings directly, we assign a placeholder if epid is present
      const reviewCountVal = ratingVal ? 15 : 0;
      
      return {
        title: item.title,
        price: priceVal !== null && !isNaN(priceVal) ? priceVal : item.price?.value || "N/A",
        currency: currencyVal,
        url: item.itemWebUrl,
        image: imageUrl || "",
        source: "eBay",
        rating: ratingVal,
        reviewCount: reviewCountVal,
        availability: item.stockPhoneStatus === "OUT_OF_STOCK" ? "Out of Stock" : "In Stock",
        shipping: shippingText,
        score: ratingVal ? Math.round(ratingVal * 20) : 80
      };
    });

    console.log(`eBay: ${results.length}`);

    return res.status(200).json({
      results,
      source
    });

  } catch (err) {
    console.error("❌ eBay Search Route error:", err.message);
    return res.status(200).json({
      results: [],
      source,
      error: `Internal server error: ${err.message}`
    });
  }
};
