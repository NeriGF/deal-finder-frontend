module.exports = async (req, res) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Support both body (POST) and query parameters (GET)
  const query = req.body?.query || req.query?.query || "";
  const source = "local-services";

  const yelpKey = process.env.YELP_API_KEY;
  const googleKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!yelpKey && !googleKey) {
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
    // 1. Try Yelp if YELP_API_KEY is available
    if (yelpKey) {
      // Default search location to USA or a specific major city
      const yelpUrl = `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(query)}&location=San+Francisco&limit=10`;
      const response = await fetch(yelpUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${yelpKey}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        const businesses = data.businesses || [];
        
        const results = businesses.map(biz => {
          const ratingVal = biz.rating ? parseFloat(biz.rating) : null;
          const reviewCountVal = biz.review_count ? parseInt(biz.review_count) : 0;
          const address = biz.location?.display_address?.join(", ") || "Local Service";

          return {
            title: biz.name,
            price: biz.price || "N/A",
            currency: "USD",
            url: biz.url,
            image: biz.image_url || "",
            source: "Local (Yelp)",
            rating: ratingVal,
            reviewCount: reviewCountVal,
            availability: biz.is_closed ? "Closed" : "Open Now",
            shipping: address,
            score: ratingVal ? Math.round(ratingVal * 20) : 80
          };
        });

        console.log(`Local Services (Yelp): ${results.length}`);

        return res.status(200).json({
          results,
          source
        });
      } else {
        console.warn("⚠️ Yelp API request failed, falling back to Google Places if possible...");
      }
    }

    // 2. Try Google Places if GOOGLE_PLACES_API_KEY is available
    if (googleKey) {
      const googleUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${googleKey}`;
      const response = await fetch(googleUrl, { method: "GET" });

      if (response.ok) {
        const data = await response.json();
        const places = data.results || [];

        const results = places.map(place => {
          const ratingVal = place.rating ? parseFloat(place.rating) : null;
          const reviewCountVal = place.user_ratings_total ? parseInt(place.user_ratings_total) : 0;
          
          let priceString = "N/A";
          if (place.price_level !== undefined) {
            priceString = "$".repeat(place.price_level);
          }

          return {
            title: place.name,
            price: priceString,
            currency: "USD",
            url: `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${place.place_id}`,
            image: place.photos?.[0]?.photo_reference 
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${googleKey}` 
              : "",
            source: "Local (Google Places)",
            rating: ratingVal,
            reviewCount: reviewCountVal,
            availability: place.business_status === "OPERATIONAL" ? "Open Now" : "Closed",
            shipping: place.formatted_address || "Local",
            score: ratingVal ? Math.round(ratingVal * 20) : 80
          };
        });

        console.log(`Local Services (Google Places): ${results.length}`);

        return res.status(200).json({
          results,
          source
        });
      } else {
        console.error("❌ Google Places API request failed as well.");
      }
    }

    // If both failed or were skipped
    return res.status(200).json({
      results: [],
      source,
      error: "Search providers API request failed"
    });

  } catch (err) {
    console.error("❌ Local Services Search Route error:", err.message);
    return res.status(200).json({
      results: [],
      source,
      error: `Internal server error: ${err.message}`
    });
  }
};
