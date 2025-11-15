import Navbar from "../components/Navbar";
 import InspectionForm from "../components/InspectionForm";

export default function AddInspection() {
  return (
    <div className="app-layout">
      <Navbar />

      <div className="page-content">
        <InspectionForm />
      </div>

     </div>
  );
}

