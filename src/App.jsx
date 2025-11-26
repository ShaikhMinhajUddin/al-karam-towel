import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import AddInspection from "./pages/AddInspection";
import ViewInspections from "./pages/ViewInspection";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Welcome from "./pages/Welcome";

function AppWrapper() {
  const location = useLocation();

  // Navbar sirf login page par hide hoga
  const showNavbar = !["/", "/login"].includes(location.pathname);


  return (
    <>
      {showNavbar && <Navbar />}

      <Routes>
        {/* First screen (DEFAULT) */}
        <Route path="/" element={<Welcome />} />

        {/* Dashboard open after clicking button */}
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/add"
          element={
            <ProtectedRoute>
              <AddInspection />
            </ProtectedRoute>
          }
        />

        <Route
          path="/view"
          element={
            <ProtectedRoute>
              <ViewInspections />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}
