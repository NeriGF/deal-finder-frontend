import { useEffect } from "react";

export default function SuccessPage() {
  useEffect(() => {
    const status = document.getElementById("status");
    const details = document.getElementById("details");
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get("session_id");

    if (!sessionId) {
      status.innerText = "⚠️ No session ID found in URL.";
    } else {
      fetch("/api/lookup-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.customerId && data.email) {
            status.innerText = `✅ Thanks, ${data.email}!`;
            localStorage.setItem("stripe_customer_id", data.customerId);

            details.innerHTML = `
              <p>👇 Copy your Stripe Customer ID below:</p>
              <div class="highlight">${data.customerId}</div>
              <p style="margin-top: 1rem;">
                Paste it back into the deal finder app to unlock your access.
              </p>
            `;
          } else {
            status.innerText = "⚠️ Could not verify your subscription.";
          }
        })
        .catch((err) => {
          console.error("❌ Lookup failed:", err);
          status.innerText = "⚠️ Error retrieving your subscription info.";
        });
    }
  }, []);

  return (
    <>
      <style>{`
        body {
          font-family: sans-serif;
          padding: 2rem;
          text-align: center;
        }
        #details {
          margin-top: 1rem;
          font-size: 1.2rem;
        }
        .highlight {
          background: #f3f3f3;
          padding: 0.5rem;
          border-radius: 5px;
          margin-top: 1rem;
          font-family: monospace;
          font-size: 1.1rem;
          display: inline-block;
        }
      `}</style>

      <h1>🎉 You’re Subscribed!</h1>
      <p id="status">Retrieving your subscription info...</p>
      <div id="details"></div>
    </>
  );
}
