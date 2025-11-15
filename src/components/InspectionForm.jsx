import { useState } from "react";
import api from "../api";
import "../components/Form.css";

export default function InspectionForm() {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);
  const months = [
    "January","February","March","April","May","June","July","August",
    "September","October","November","December"
  ];

  const initialState = {
    serialNo: "",
    year: years[0],
    month: months[0],
    inspectionId: "",
    inspectionDate: "",
    servicePerformed: "",
    inspectionType: "",
    dpi: "",
    bvFinal: "",
    aktiSelf: "",
    inspectorName: "",
    offeredQtyCtn: "",
    offeredQtyPacks: "",
    noOfInspection: "",
    pass: "",
    fail: "",
    abort: "",
    pending: "",
    inspectionStatus: "",
    sampleSize: "",
    major: "",
    minor: "",
    oql: "",
    percentAllowed: "",
    critical: "",
    actualMajor: "",
    actualMinor: "",
    actualOql: "",
    pulledTerry: "",
    rawEdge: "",
    weaving: "",
    uncutThread: "",
    stainMajor: "",
    skipStitch: "",
    brokenStitch: "",
    runoffStitch: "",
    poorShape: "",
    pleat: "",
    insecureLabel: "",
    missingLabel: "",
    contaminationMajor: "",
    slantLabel: "",
    damageFabric: "",
    hole: "",
    looseStitch: "",
    singleUntrimmedThread: "",
    contaminationMinor: "",
    flyYarn: "",
    dustMark: "",
    stainMinor: "",
    lassar: 0,
    patta: 0,
    shadeOut: 0,
  };

  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const numericFields = [
    
  ];

  const textFields = [
  
  ];

  const statusFields = ["pass","fail","abort","pending"];

  // ---------------- Handle Change ----------------
  const handleChange = (e) => {
  const { name, value } = e.target;
  let newValue = value;

  

  if (statusFields.includes(name)) {
    if (value !== "0" && value !== "1" && value !== "") return;
    if (value === "1") {
      const updated = { ...form, [name]: 1 };
      statusFields.forEach(f => { if (f !== name) updated[f] = 0; });
      updated.inspectionStatus =
        name === "pass" ? "Pass" :
        name === "fail" ? "Fail" :
        name === "pending" ? "Pending" :
      setForm(updated);
      return;
    }
  }

  const updatedForm = { ...form, [name]: newValue };

  const major = parseFloat(updatedForm.major) || 0;
  const minor = parseFloat(updatedForm.minor) || 0;
  const critical = parseFloat(updatedForm.critical) || 0;
  const sampleSize = parseFloat(updatedForm.sampleSize) || 0;
  const lassar = parseFloat(updatedForm.lassar) || 0;
  const patta = parseFloat(updatedForm.patta) || 0;
  const shadeOut = parseFloat(updatedForm.shadeOut) || 0;

  // Auto-calculate OQL only if the user hasn't manually entered it
  if (name !== "oql" && form.oql !== "0") {
    updatedForm.oql = sampleSize > 0 ? ((major / sampleSize) * 100).toFixed(2) : "";
  }

  // Auto-calculate DPI only if the user hasn't manually entered it
  if (name !== "dpi" && form.dpi !== "0") {
    updatedForm.dpi = sampleSize > 0 ? ((major / sampleSize) * 100).toFixed(2) : "";
  }

  setForm(updatedForm);
};


  // ---------------- Handle Submit ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    for (let key in form) {
      if (form[key] === "" || form[key] === null) {
        setMessage(`⚠️ Please fill the field: ${key.replace(/([A-Z])/g, " $1")}`);
        return;
      }
    }

    if (Number(form.offeredQtyCtn) > Number(form.offeredQtyPacks)) {
      setMessage("⚠️ Offered QTY CTN cannot be greater than Offered QTY Packs");
      return;
    }

    setLoading(true);
    try {
      const processed = Object.fromEntries(
        Object.entries(form).map(([key, value]) => {
          if (key === "inspectionDate") return [key, new Date(value)];
          return [key, !isNaN(Number(value)) ? Number(value) : value];
        })
      );

      await api.post("/inspections", processed);
      setMessage("✅ Inspection added successfully!");
      setForm(initialState);
    } catch (err) {
      console.error("Form submit error:", err);
      setMessage("❌ Failed to save inspection");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Form Sections ----------------
  const sections = [
    { title: "BASIC INFORMATION", color: "#4B5563", fields: [
      "serialNo","year","month","inspectionId","inspectionDate","servicePerformed",
      "inspectionType","dpi","bvFinal","aktiSelf","inspectorName","offeredQtyCtn",
      "offeredQtyPacks","noOfInspection","pass","fail","abort","pending","inspectionStatus","sampleSize"
    ]},
    { title: "REQUIRED OQL 2.5 (M) / 4.0 (m)", color: "#FFD700", fields: ["major","minor","oql","percentAllowed"] },
    { title: "ACTUAL FINDINGS", color: "#2ECC71", fields: ["critical","actualMajor","actualMinor","actualOql"] },
    { title: "MAJOR DEFECTS DETAILS", color: "#f73c3c", fields: [
      "pulledTerry","rawEdge","weaving","uncutThread","stainMajor","skipStitch","brokenStitch",
      "runoffStitch","poorShape","pleat","insecureLabel","missingLabel","contaminationMajor",
      "slantLabel","damageFabric","hole","looseStitch"
    ]},
    { title: "PROCESS DEFECTS DETAILS", color: "#8B5CF6", fields: ["lassar", "patta", "shadeOut"] },
    { title: "MINOR DEFECTS DETAILS", color: "#FFA500", fields: [
      "singleUntrimmedThread","contaminationMinor","flyYarn","dustMark","stainMinor"
    ]}
  ];

  return (
    <div className="inspection-form-wrapper">
      <form onSubmit={handleSubmit} className="inspection-form">
        <h1 className="text-2xl font-bold mb-4">Add New Inspection</h1>

        {sections.map((section, idx) => (
          <div key={idx} className="form-section">
            <h3 className="section-header" style={{ backgroundColor: section.color }}>
              {section.title}
            </h3>
            <div className="fields-grid">
              {section.fields.map((key) => (
                <div key={key} className="form-field">
                  <label>{key.replace(/([A-Z])/g, " $1")}</label>

                  {key === "year" ? (
                    <select name="year" value={form.year} onChange={handleChange}>
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  ) : key === "month" ? (
                    <select name="month" value={form.month} onChange={handleChange}>
                      {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  ) : key === "inspectionStatus" ? (
                    <input type="text" name="inspectionStatus" value={form.inspectionStatus} disabled />
                  ) : ["pass","fail","abort","pending"].includes(key) || numericFields.includes(key) ? (
                    <input
                      type="number"
                      name={key}
                      value={form[key]}
                      onChange={handleChange}
                      min={0}
                      step="1"
                      placeholder={["pass","fail","abort","pending"].includes(key) ? "0 or 1" : ""}
                    />
                  ) : (
                    <input
                      type={key === "inspectionDate" ? "date" : "text"}
                      name={key}
                      value={form[key]}
                      onChange={handleChange}
                      placeholder={`Enter ${key.replace(/([A-Z])/g, " $1").toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="form-footer">
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Saving..." : "Add Inspection"}
          </button>
          {message && (
            <p className={`status-message ${message.startsWith("✅") ? "success" : "error"}`}>
              {message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
