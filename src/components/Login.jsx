import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const adminPassword = "admin@@@";

  // 🚫 Prevent already logged-in users from accessing login page
  useEffect(() => {
    const isAuth = sessionStorage.getItem("tc_isAuth");
    if (isAuth === "1") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (password === adminPassword) {
        sessionStorage.setItem("tc_isAuth", "1");
        sessionStorage.setItem("tc_auth_at", new Date().toISOString());
        navigate("/", { replace: true }); // redirect to dashboard
      } else {
        setError("Incorrect password.");
      }
      setLoading(false);
    }, 500);
  };

  const styles = {
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#f3f4f6",
    },
    card: {
      width: "500px",
      padding: "2rem",
      borderRadius: "12px",
      backgroundColor: "#fff",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      flexDirection: "column",
    },
    title: {
      textAlign: "center",
      marginBottom: "1.5rem",
      fontSize: "1.5rem",
      fontWeight: "600",
      color: "#1e3a8a",
    },
    label: {
      display: "block",
      fontWeight: "500",
      marginBottom: "0.5rem",
      color: "#334155",
    },
    input: {
      width: "100%",
      padding: "0.5rem",
      marginBottom: "1rem",
      borderRadius: "6px",
      border: "1px solid #cbd5e1",
      fontSize: "1rem",
    },
    button: {
      width: "100%",
      padding: "0.7rem",
      backgroundColor: "#1e3a8a",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
      fontSize: "1rem",
    },
    buttonDisabled: {
      backgroundColor: "#94a3b8",
      cursor: "not-allowed",
    },
    error: {
      color: "#dc2626",
      marginBottom: "1rem",
      textAlign: "center",
      fontSize: "0.9rem",
    },
    note: {
      marginTop: "1rem",
      fontSize: "0.8rem",
      color: "#64748b",
      textAlign: "center",
    },
  };

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h2 style={styles.title}>Admin Login</h2>

        <label style={styles.label}>
          Password
          <input
            type="password"
            style={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            autoFocus
            aria-label="Password"
          />
        </label>

        {error && <div style={styles.error}>{error}</div>}

        <button
          type="submit"
          style={{
            ...styles.button,
            ...(loading || !password ? styles.buttonDisabled : {}),
          }}
          disabled={loading || password.trim() === ""}
        >
          {loading ? "Checking…" : "Sign in"}
        </button>

        <div style={styles.note}>
          Enter the admin password to access the dashboard.
        </div>
      </form>
    </div>
  );
}
