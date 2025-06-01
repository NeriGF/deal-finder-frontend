import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    document.getElementById("userKey").value =
      localStorage.getItem("stripe_customer_id") || "";
  }, []);

  const MCP_ENDPOINT = "https://deal-finder-mcp.mydeals-ai.workers.dev";

  return (
    <>
      <style>{`
        body {
          font-family: sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          background: #f9f9f9;
        }
        input, select {
          padding: 0.5rem;
          width: 300px;
          margin-bottom: 10px;
        }
        button {
          padding: 0.5rem 1rem;
          margin-top: 10px;
        }
        .deal {
          background: #fff;
          border: 1px solid #ccc;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
          width: 90%;
          max-width: 600px;
        }
        .score {
          font-weight: bold;
          color: #007b00;
        }
        .tag {
          background-color: gold;
          color: black;
          font-size: 0.8rem;
          padding: 2px 6px;
          margin-left: 8px;
          border-radius: 4px;
        }
      `}</style>

      <h1>🛒 Find Best Deals (Amazon + Walmart)</h1>

      <button
        onClick={() => startCheckout()}
        style={{ background: "#00aa66", color: "white" }}
      >
        Login to Unlock (Stripe)
      </button>

      <input type="text" id="userKey" placeholder="Paste your Stripe Customer ID here (cus_...)" required />
      <input type="text" id="searchInput" placeholder="e.g. noise cancelling headphones" />
      <select id="siteSelect">
        <option value="all">Amazon + Walmart</option>
        <option value="amazon">Amazon Only</option>
        <option value="walmart">Walmart Only</option>
      </select>

      <button onClick={() => searchDeals()}>Find Deals</button>
      <button onClick={() => getTopDeal()}>🔥 View Today’s Top Deal</button>
      <button onClick={() => openBillingPortal()}>⚙️ Manage or Cancel Subscription</button>

      <div id="results" style={{ marginTop: "2rem" }}>Search something to see results!</div>

      <script dangerouslySetInnerHTML={{ __html: `
        const MCP_ENDPOINT = "${MCP_ENDPOINT}";

        async function startCheckout() {
          const email = prompt("Enter your email:");
          if (!email || !email.includes("@")) return alert("Invalid email");
          const res = await fetch("/api/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
          });
          const json = await res.json();
          if (json.url) window.location.href = json.url;
        }

        async function searchDeals() {
  const query = document.getElementById("searchInput").value;
  const userKey = document.getElementById("userKey").value;
  const site = document.getElementById("siteSelect").value;
  const resultsDiv = document.getElementById("results");

  console.log("🔍 Submitting search with:", { query, userKey, site });

  if (!userKey || !userKey.startsWith("cus_")) {
    resultsDiv.innerHTML = "⚠️ Enter a valid Stripe customer ID.";
    return;
  }

  const isValid = await fetch("/api/validate-customer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userKey })
  }).then(res => res.json());

  if (!isValid.valid) {
    resultsDiv.innerHTML = `⚠️ Access denied: ${isValid.error || "Subscription required."}`;
    return;
  }

  resultsDiv.innerHTML = "🔎 Searching...";
  try {
    const payload = {
      tool: "find_best_deals",
      parameters: { query, userKey, site }
    };

    console.log("📤 Sending request to MCP:", payload);

    const response = await fetch(MCP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("✅ Response from MCP:", data);

    if (data.deals?.length > 0) {
      resultsDiv.innerHTML = data.deals.map(deal => `
        <div class="deal">
          <a href="${deal.url}" target="_blank"><strong>${deal.title}</strong></a><br />
          <span>${deal.price}</span><br />
          ${deal.score ? `<span class="score">Score: ${deal.score}</span>` : ""}
          ${deal.tag ? `<span class="tag">${deal.tag}</span>` : ""}
        </div>`).join("");
    } else {
      resultsDiv.innerHTML = "No deals found.";
    }
  } catch (err) {
    console.error("❌ MCP error:", err);
    resultsDiv.innerHTML = "Something went wrong.";
  }
}


        async function openBillingPortal() {
          const customerId = localStorage.getItem("stripe_customer_id");
          if (!customerId || !customerId.startsWith("cus_")) {
            alert("Missing or invalid Stripe customer ID.");
            return;
          }

          const res = await fetch("/api/create-billing-portal-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ customerId })
          });

          const json = await res.json();

          if (json.url) {
            window.location.href = json.url;
          } else if (json.error?.includes("No such customer")) {
            alert("⚠️ This customer ID no longer exists. Please sign up again.");
            localStorage.removeItem("stripe_customer_id");
          } else {
            alert("❌ Failed to open billing portal.");
          }
        }
      ` }} />
    </>
  );
}
