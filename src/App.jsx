import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AddInspection from "./pages/AddInspection";
import ViewInspections from "./pages/ViewInspection";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
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
    </Router>
  );
}
