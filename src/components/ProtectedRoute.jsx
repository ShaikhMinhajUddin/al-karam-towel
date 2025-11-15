 import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const isAuth = sessionStorage.getItem("tc_isAuth") === "1";
  if (!isAuth) return <Navigate to="/login" replace />;
  return children;
}
