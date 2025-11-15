import Navbar from "../components/Navbar";
 import InspectionTable from "../components/InspectionTable";

export default function ViewInspections() {
  return (
    <div className="app-layout">
      <Navbar />

      <div className="page-content">
        <InspectionTable />
      </div>

     </div>
  );
}

