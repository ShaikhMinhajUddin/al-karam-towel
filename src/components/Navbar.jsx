import logo from "../images/logooo.png";

import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  PlusCircleIcon,
  EyeIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import "./Navbar.css";

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check login status from sessionStorage
    const auth = sessionStorage.getItem("tc_isAuth");
    setIsLoggedIn(auth === "1");
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("tc_isAuth");
    sessionStorage.removeItem("tc_auth_at");
    setIsLoggedIn(false);
    navigate("/login", { replace: true });
  };

  const allLinks = [
    { to: "/dashboard", label: "Dashboard", icon: <HomeIcon className="nav-icon" /> },
    { to: "/add", label: "Add Inspection", icon: <PlusCircleIcon className="nav-icon" /> },
    { to: "/view", label: "View Inspections", icon: <EyeIcon className="nav-icon" /> },
  ];

  const guestLinks = [
    { to: "/dashboard", label: "Dashboard", icon: <HomeIcon className="nav-icon" /> },
  ];

  return (
    <nav className="navbar" style={{ marginLeft: 0, transition: "margin-left 0.3s" }}>
      {/* Title */}
      <div className="navbar-logo">
  <img src={logo} alt="Company Logo" className="navbar-logo-img" />
  <h1 className="navbar-title">AL-KARAM TOWEL INDUSTRIES (PVT) LTD</h1>
</div>


      {/* Hamburger */}
      <button
        className="hamburger-btn"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation menu"
      >
        {menuOpen ? <XMarkIcon className="hamburger-icon" /> : <Bars3Icon className="hamburger-icon" />}
      </button>

      {/* Links */}
      <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
        {(isLoggedIn ? allLinks : guestLinks).map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={pathname === link.to ? "active" : ""}
            onClick={() => setMenuOpen(false)}
          >
            {link.icon}
            <span className="nav-label">{link.label}</span>
          </Link>
        ))}

        {/* Show login/logout button */}
        {isLoggedIn ? (
          <button className="btn-login" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <button className="btn-login" onClick={() => navigate("/login")}>
            Login as Admin
          </button>
        )}
      </div>
    </nav>
  );
}
