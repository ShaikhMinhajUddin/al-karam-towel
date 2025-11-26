import Navbar from "../components/Navbar";
 import Dashboard from "../components/Dashboard";

export default function Home() {
  return (
    <div className="app-layout">
      <Navbar />

      <div className="page-content">
        <div style={{ overflow: "hidden", width: "100%" }}>
  <h1 className="animated-heading">
    QUALITY PERFORMANCE DASHBOARD
  </h1>
</div>


        <Dashboard />
      </div>

     </div>
  );
}

