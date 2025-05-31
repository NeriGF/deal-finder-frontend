import { useEffect } from "react";

export default function AdminPage() {
  useEffect(() => {
    // expose verifyAdmin on window so it's callable from the button
    window.verifyAdmin = async function () {
      const pass = document.getElementById("adminPass").value;

      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass }),
      });

      const json = await res.json();

      if (json.auth) {
        localStorage.setItem("admin_token", json.token);
        window.location.href = "/admin-dashboard";
      } else {
        alert("❌ Access denied");
      }
    };
  }, []);

  return (
    <>
      <style>{`
        body { font-family: sans-serif; padding: 2rem; text-align: center; }
        input { padding: 0.5rem; width: 250px; margin-bottom: 10px; }
      `}</style>

      <h1>🔐 Admin Access</h1>
      <input type="password" id="adminPass" placeholder="Admin password" />
      <br />
      <button onClick={() => window.verifyAdmin()}>Login</button>
    </>
  );
}
