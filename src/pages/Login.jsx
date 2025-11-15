import Navbar from "../components/Navbar";
 
import Login from "../components/Login";

export default function LoginPage() {
  return (
    <div className="app-layout">
      <Navbar />

      <div className="page-content">
        <Login />
      </div>

     </div>
  );
}

