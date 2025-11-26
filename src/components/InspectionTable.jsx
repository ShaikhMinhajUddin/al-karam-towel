import { useEffect, useState, useRef } from "react";
import api from "../api";
import "./Table.css";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function Toast({ message, type, onClose }) {
  return (
    <div className={`toast ${type}`}>
      <span>{message}</span>
      <button className="close-btn" onClick={onClose}>×</button>
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay">
      <div className="confirm-box">
        <h4>{title}</h4>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-confirm" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function InspectionTable() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [formData, setFormData] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const fileInputRef = useRef(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false); // ✅ Added


  const numberFields = [
    "serialNo","year","inspectionId","offeredQtyCtn","offeredQtyPacks","noOfInspection",
    "pass","fail","abort","pending","sampleSize",
    "major","minor","oql","percentAllowed","critical","actualMajor","actualMinor","actualOql",
    "pulledTerry","rawEdge","weaving","uncutThread","stainMajor","skipStitch","brokenStitch",
    "runoffStitch","poorShape","pleat","insecureLabel","missingLabel","contaminationMajor",
    "slantLabel","damageFabric","hole","looseStitch","singleUntrimmedThread","contaminationMinor",
    "flyYarn","dustMark","stainMinor","lassar","patta","shadeOut"
  ];

  const defectFields = [
    "major","minor","critical","actualMajor","actualMinor","actualOql",
    "pulledTerry","rawEdge","weaving","uncutThread","stainMajor",
    "skipStitch","brokenStitch","runoffStitch","poorShape","pleat",
    "insecureLabel","missingLabel","contaminationMajor","slantLabel",
    "damageFabric","hole","looseStitch","singleUntrimmedThread",
    "contaminationMinor","flyYarn","dustMark","stainMinor","lassar",
    "patta","shadeOut"
  ];

  const dateFields = ["inspectionDate"];

  const getTotalDefects = (row) =>
    defectFields.reduce((sum, field) => sum + (Number(row[field]) || 0), 0);

  useEffect(() => { fetchInspections(); }, []);

  const fetchInspections = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/inspections");
      setInspections(res.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load inspection data.");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const deleteInspection = async (id) => {
  try {
    await api.delete(`/inspections/${id}`);

    // Show success message first
    showToast("Inspection deleted successfully!", "success");

    // Remove deleted item from UI immediately
    const newFiltered = inspections.filter((item) => item._id !== id);
    setInspections(newFiltered);

    // Recalculate pages
    const newTotalPages = Math.ceil(newFiltered.length / rowsPerPage);
    if (currentPage > newTotalPages) setCurrentPage(newTotalPages || 1);

    // Fetch fresh data after short delay so toast stays visible
    setTimeout(() => {
      fetchInspections();
    }, 500);

  } catch (err) {
    console.error("Delete error:", err);
    showToast("Failed to delete inspection.", "error");
  }
};


  //Delete ALL
  const deleteAllInspections = async () => {
    try {
      await api.delete("/inspections/deleteAll");
      setInspections([]);
      setCurrentPage(1);
      showToast("All inspections deleted successfully!");
    } catch (err) {
      console.error("Delete All error:", err);
      showToast("Failed to delete all inspections.", "error");
    }
  };

  const openEditModal = (row) => {
    setEditingRow(row);
    setFormData({ ...row });
    setIsEditing(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: numberFields.includes(name) && value !== "" ? Number(value) : value
    }));
  };

  const saveEdit = async () => {
    try {
      const cleanData = { ...formData };
      delete cleanData._id;
      delete cleanData.__v;
      dateFields.forEach((field) => {
        if (cleanData[field]) cleanData[field] = new Date(cleanData[field]);
      });
      await api.put(`/inspections/${editingRow._id}`, cleanData);
      showToast("Inspection updated successfully!");
      setIsEditing(false);
      fetchInspections();
    } catch (err) {
      console.error("Update error:", err);
      showToast("Failed to update inspection.", "error");
    }
  };

  // -------- Import CSV/Excel and persist to MongoDB --------
 // ------------------------ Updated normalizeRow for automatic space removal ------------------------
const normalizeRow = (row) => {
  const normalized = {};
  const mapping = {
    "Inspection Type": "inspectionType",
    "pulled Terry": "pulledTerry",
    "akti Self": "aktiSelf",
    "actual Major": "actualMajor",
    "actual Minor": "actualMinor",
    "actual Oql": "actualOql",
    "skip Stitch": "skipStitch",
    "broken Stitch": "brokenStitch",
    "runoff Stitch": "runoffStitch",
    "poor Shape": "poorShape",
    "insecure Label": "insecureLabel",
    "Label missing": "missingLabel",
    "Label contamination": "contaminationMajor",
    "Major slant": "slantLabel",
    "Label damage": "damageFabric",
    "Fabric hole": "hole",
    "loose Stitch": "looseStitch",
    "single Untrimmed Thread": "singleUntrimmedThread",
    "contamination Minor": "contaminationMinor",
    "fly Yarn": "flyYarn",
    "dust Mark": "dustMark",
    "stain": "stainMinor"
  };

  for (let k in row) {
    const normalizedKey = mapping[k] || k.replace(/\s+/g, "");
    normalized[normalizedKey] = row[k];
  }

  // ---------- Dates ----------
  dateFields.forEach(f => {
    if (normalized[f]) {
      const asDate = new Date(normalized[f]);
      normalized[f] = isNaN(asDate.getTime()) ? normalized[f] : asDate.toISOString();
    }
  });

  // ---------- Numbers ----------
  numberFields.forEach(f => {
    if (normalized[f] !== undefined && normalized[f] !== null && normalized[f] !== "") {
      const n = Number(normalized[f].toString().replace(/,/g, "")); // commas remove
      normalized[f] = isNaN(n) ? 0 : n;  // NaN => 0
    }
  });

  // ---------- Derive year/month if missing ----------
  if (!normalized.year && normalized.inspectionDate) 
      normalized.year = new Date(normalized.inspectionDate).getFullYear();
  if (!normalized.month && normalized.inspectionDate) 
      normalized.month = new Date(normalized.inspectionDate).toLocaleString("en-US", { month: "long" });

  return normalized;
};


  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const importedDataRaw = XLSX.utils.sheet_to_json(ws, { defval: "" });

        const importedData = importedDataRaw.map(normalizeRow);

        setInspections(importedData);
        setCurrentPage(1);
        showToast("File imported successfully!");

        try {
          await api.post("/inspections/import", importedData, { headers: { "Content-Type": "application/json" } });
          showToast("Imported data saved to database!");
          fetchInspections();
        } catch (persistErr) {
          console.error("Persist error:", persistErr);
          showToast("Imported but failed to save to DB.", "error");
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("Import error:", err);
      showToast("Failed to import file.", "error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ---------------------- Export PDF ----------------------
  const exportPDF = () => {
    if (!inspections.length) return showToast("No data to export.", "error");

    const doc = new jsPDF("landscape");
    doc.setFontSize(16);
    doc.text("Inspection Report", 14, 14);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 20);

    const baseColumns = [
      "customer", "inspectionId", "inspectionDate", "year", "month",
      "inspectorName", "inspectionStatus", "pass", "fail", "abort", "pending"
    ];
    const existingColumns = baseColumns.filter(c => inspections.some(r => Object.prototype.hasOwnProperty.call(r, c)));

    const tableRows = inspections.map(row =>
      existingColumns.map(col => {
        if (dateFields.includes(col) && row[col]) {
          const dt = new Date(row[col]);
          return isNaN(dt.getTime()) ? row[col] : dt.toLocaleDateString();
        }
        return row[col] ?? "-";
      })
    );

    autoTable(doc, {
      head: [existingColumns.map(col => col.replace(/([A-Z])/g, " $1"))],
      body: tableRows,
      startY: 26,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [33, 150, 243] },
      theme: "striped",
      didDrawPage: (data) => {
        const pageNumber = doc.getCurrentPageInfo().pageNumber;
        doc.setFontSize(8);
        doc.text(`Page ${pageNumber}`, doc.internal.pageSize.getWidth() - 20, doc.internal.pageSize.getHeight() - 10);
      }
    });

    doc.save("inspection_report.pdf");
  };

//ALL DEFECTS SHOW PDF
// const exportPDF = () => {
//   if (!inspections.length) return showToast("No data to export.", "error");

//   const doc = new jsPDF("landscape");
//   doc.setFontSize(16);
//   doc.text("Inspection Report", 14, 14);
//   doc.setFontSize(10);
//   doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 20);

//   const baseColumns = [
//     "customer", "inspectionId", "inspectionDate", "year", "month",
//     "inspectorName", "inspectionStatus", "pass", "fail", "abort", "pending"
//   ];

//   // <-- ADD HERE
//   const defectColumnsToInclude = defectFields.filter(field =>
//     inspections.some(row => Number(row[field]) > 0)
//   );

//   // Merge base columns and dynamic defect columns
//   const allColumns = [...baseColumns, ...defectColumnsToInclude];

//   const tableRows = inspections.map(row =>
//     allColumns.map(col => {
//       if (dateFields.includes(col) && row[col]) {
//         const dt = new Date(row[col]);
//         return isNaN(dt.getTime()) ? row[col] : dt.toLocaleDateString();
//       }
//       return row[col] ?? "-";
//     })
//   );

//   autoTable(doc, {
//     head: [allColumns.map(col => col.replace(/([A-Z])/g, " $1"))],
//     body: tableRows,
//     startY: 26,
//     styles: { fontSize: 8, cellPadding: 2 },
//     headStyles: { fillColor: [33, 150, 243] },
//     theme: "striped",
//     didDrawPage: (data) => {
//       const pageNumber = doc.getCurrentPageInfo().pageNumber;
//       doc.setFontSize(8);
//       doc.text(
//         `Page ${pageNumber}`,
//         doc.internal.pageSize.getWidth() - 20,
//         doc.internal.pageSize.getHeight() - 10
//       );
//     }
//   });

//   doc.save("inspection_report.pdf");
// };




  if (loading) return <p className="center-msg">Loading...</p>;
  if (error) return <p className="center-msg error">{error}</p>;

  const columns = Array.from(
  new Set(
    inspections.flatMap(row => Object.keys(row))
  )
).filter(k => !["_id","__v","createdAt","updatedAt"].includes(k));

  const filtered = inspections.filter(row =>
    columns.some(col => row[col]?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const current = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  return (
    <div className="inspection-table-container">
      <div className="table-header">
        <h3>Inspection Records</h3>
        <div className="header-actions">
          <input ref={fileInputRef} type="file" accept=".xlsx,.csv" onChange={handleFileUpload} style={{ marginRight: "10px" }} />
          <button onClick={exportPDF}>Export PDF</button>
{/* Delete All Button */}
  <button 
  onClick={() => setConfirmDeleteAll(true)} 
  style={{ backgroundColor: "red", color: "white", marginLeft: "10px" }}
>
  Delete All
</button>

          
        </div>
        <input className="search-input" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              {columns.map(col => <th key={col}>{col.replace(/([A-Z])/g, " $1")}</th>)}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {current.map((row, i) => (
              <tr key={row._id || i}>
                <td>{indexOfFirst + i + 1}</td>
                {columns.map(col => (
                  <td key={col}>
                    {dateFields.includes(col) && row[col]
                      ? (() => { const dt = new Date(row[col]); return isNaN(dt.getTime()) ? row[col] : dt.toLocaleDateString(); })()
                      : row[col] ?? "-"
                    }
                  </td>
                ))}
    
                <td className="actions">
                  <button className="btn-edit" onClick={() => openEditModal(row)}>Edit</button>
                  <button className="btn-delete" onClick={() => deleteInspection(row._id)}>Delete</button>
                  </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button disabled={currentPage===1} onClick={() => setCurrentPage(currentPage-1)}>Prev</button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} className={currentPage===i+1?"active":""} onClick={()=>setCurrentPage(i+1)}>{i+1}</button>
        ))}
        <button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(currentPage+1)}>Next</button>
      </div>

      {isEditing && (
        <div className="modal-overlay">
          <div className="modal wide professional">
            <div className="modal-header">
              <h2>Edit Inspection Record</h2>
              <button className="modal-close" onClick={()=>setIsEditing(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-grid">
                {columns.map(col => (
                  <div key={col} className="modal-field">
                    <label>{col.replace(/([A-Z])/g, " $1")}</label>
                    <input
                      type={dateFields.includes(col)?"date":numberFields.includes(col)?"number":"text"}
                      name={col}
                      value={dateFields.includes(col) && formData[col] ? new Date(formData[col]).toISOString().split("T")[0] : formData[col] ?? ""}
                      onChange={handleChange}
                      className="field-input"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={()=>setIsEditing(false)}>Cancel</button>
              <button className="btn-save" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteAll && (
  <ConfirmDialog
    title="Delete All Confirmation"
    message="Are you sure you want to delete ALL inspection records? This action cannot be undone."
    onCancel={()=>setConfirmDeleteAll(false)}
    onConfirm={()=>{ deleteAllInspections(); setConfirmDeleteAll(false); }}
  />
)}


      {toast && <Toast {...toast} onClose={()=>setToast(null)} />}
    </div>
  );
}
