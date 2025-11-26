import { useNavigate } from "react-router-dom";
import "./Welcome.css";
import logo from "../images/logooo.png"; // ← import karo

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <div className="animated-bg"></div>

      <div className="glass-card">
        {/* Logo above the card */}
        <img
          src={logo} // ← yahan import se use karo
          alt="Logo"
          className="logo-above-card"
        />

        <h1 className="welcome-heading">QUALITY PERFORMANCE DASHBOARD</h1>
        <p className="welcome-subtitle">
          Smart Monitoring • Strong Performance • Power in Results
        </p>

        <button className="go-btn" onClick={() => navigate("/dashboard")}>
          Enter Dashboard →
        </button>
      </div>
    </div>
  );
}
