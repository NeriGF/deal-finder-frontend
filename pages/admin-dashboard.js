import { useEffect } from "react";

export default function AdminDashboard() {
  useEffect(() => {
    const token = localStorage.getItem("admin_token");

    fetch("/api/list-customers", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const list = document.getElementById("customerList");
        if (!data.customers) {
          list.innerHTML = "<li>❌ Failed to load customer data</li>";
          return;
        }

        list.innerHTML = data.customers
          .map(
            (cust) => `
            <li>
              <strong>${cust.email}</strong> - ${cust.status}
              ${
                cust.current_period_end
                  ? ` (ends: ${new Date(
                      cust.current_period_end * 1000
                    ).toLocaleDateString()})`
                  : ""
              }
              <button onclick="resetUsage('${cust.id}')">🔁 Reset Usage</button>
            </li>`
          )
          .join("");
      })
      .catch((err) => {
        console.error("Error loading dashboard:", err);
      });

    // Attach resetUsage globally for button onclick handlers
    window.resetUsage = function resetUsage(customerId) {
      fetch("/api/proxy-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify({ customerId }),
      }).then((res) => {
        if (res.ok) {
          alert("Usage reset!");
          location.reload();
        } else {
          alert("Failed to reset usage.");
        }
      });
    };
  }, []);

  return (
    <>
      <style>{`
        body { font-family: sans-serif; padding: 2rem; }
        .customer { margin-bottom: 1rem; border-bottom: 1px solid #ccc; padding-bottom: 0.5rem; }
      `}</style>

      <h1>📊 Admin Dashboard</h1>
      <div id="customers">Loading customers...</div>
      <ul id="customerList"></ul>
    </>
  );
}
