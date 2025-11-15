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
      showToast("Inspection deleted successfully!");
      const newFiltered = inspections.filter((item) => item._id !== id);
      const newTotalPages = Math.ceil(newFiltered.length / rowsPerPage);
      if (currentPage > newTotalPages) setCurrentPage(newTotalPages || 1);
      fetchInspections();
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete inspection.", "error");
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
  const normalizeRow = (row) => {
    const normalized = { ...row };

    // Normalize dates
    dateFields.forEach((f) => {
      if (normalized[f]) {
        const asDate = new Date(normalized[f]);
        normalized[f] = isNaN(asDate.getTime()) ? normalized[f] : asDate.toISOString();
      }
    });

    // Normalize numbers
    numberFields.forEach((f) => {
      if (normalized[f] !== undefined && normalized[f] !== null && normalized[f] !== "") {
        const n = Number(normalized[f]);
        normalized[f] = isNaN(n) ? normalized[f] : n;
      }
    });

    // Derive year if missing
    if (!normalized.year && normalized.inspectionDate) {
      const dt = new Date(normalized.inspectionDate);
      if (!isNaN(dt.getTime())) normalized.year = dt.getFullYear();
    }

    // Derive month if missing (use full month name)
    if (!normalized.month && normalized.inspectionDate) {
      const dt = new Date(normalized.inspectionDate);
      if (!isNaN(dt.getTime())) {
        normalized.month = dt.toLocaleString("en-US", { month: "long" });
      }
    }

    return normalized;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const importedDataRaw = XLSX.utils.sheet_to_json(ws, { defval: "" });

        // Normalize rows to your schema
        const importedData = importedDataRaw.map(normalizeRow);

        // Update UI immediately
        setInspections(importedData);
        showToast("File imported successfully!");

        // Persist to backend (bulk insert)
        try {
          await api.post("/inspections/import", importedData, {
            headers: { "Content-Type": "application/json" }
          });
          showToast("Imported data saved to database!");
          fetchInspections(); // reload from DB to ensure IDs etc.
        } catch (persistErr) {
          console.error("Persist error:", persistErr);
          showToast("Imported but failed to save to DB.", "error");
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      console.error("Import error:", err);
      showToast("Failed to import file.", "error");
    } finally {
      // allow re-selecting the same file
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ---------------------- Export PDF ----------------------
  const exportPDF = () => {
  if (inspections.length === 0) return showToast("No data to export.", "error");

  const doc = new jsPDF("landscape"); // landscape for wide tables
  const generatedAt = new Date().toLocaleString();
  doc.setFontSize(16);
  doc.text("Inspection Report", 14, 14);
  doc.setFontSize(10);
  doc.text(`Generated: ${generatedAt}`, 14, 20);

  const baseColumns = [
    "inspectionId",
    "inspectionDate",
    "year",
    "month",
    "inspectorName",
    "inspectionStatus",
    "pass",
    "fail",
    "abort",
    "pending",
  ];
  const existingColumns = baseColumns.filter((c) =>
    inspections.some((r) => Object.prototype.hasOwnProperty.call(r, c))
  );

  const tableColumn = [...existingColumns, "Total Defects"];

  const tableRows = inspections.map((row) => {
    const cells = existingColumns.map((col) => {
      if (dateFields.includes(col) && row[col]) {
        const dt = new Date(row[col]);
        return isNaN(dt.getTime()) ? row[col] : dt.toLocaleDateString();
      }
      return row[col] ?? "-";
    });
    return [...cells, getTotalDefects(row)];
  });

  // ✅ Correct usage of autoTable
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 26,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [33, 150, 243] },
    theme: "striped",
    didDrawPage: () => {
      const pageNumber = doc.getCurrentPageInfo().pageNumber;
      doc.setFontSize(8);
      doc.text(
        `Page ${pageNumber}`,
        doc.internal.pageSize.getWidth() - 20,
        doc.internal.pageSize.getHeight() - 10
      );
    },
  });

  doc.save("inspection_report.pdf");
};


  if (loading) return <p className="center-msg">Loading...</p>;
  if (error) return <p className="center-msg error">{error}</p>;

  const columns = Object.keys(inspections[0] || {}).filter(
    (k) => !["_id", "__v", "createdAt", "updatedAt"].includes(k)
  );

  const filtered = inspections.filter((row) =>
    columns.some((col) =>
      row[col]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileUpload}
            style={{ marginRight: "10px" }}
          />
          <button onClick={exportPDF}>Export PDF</button>
        </div>
        <input
          className="search-input"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              {columns.map((col) => <th key={col}>{col.replace(/([A-Z])/g, " $1")}</th>)}
              <th>Total Defects</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {current.map((row, i) => (
              <tr key={row._id || i}>
                <td>{indexOfFirst + i + 1}</td>
                {columns.map((col) => (
                  <td key={col}>
                    {dateFields.includes(col) && row[col]
                      ? (() => {
                          const dt = new Date(row[col]);
                          return isNaN(dt.getTime()) ? row[col] : dt.toLocaleDateString();
                        })()
                      : row[col] ?? "-"}
                  </td>
                ))}
                <td>{getTotalDefects(row)}</td>
                <td className="actions">
                  <button className="btn-edit" onClick={() => openEditModal(row)}>Edit</button>
                  <button className="btn-delete" onClick={() => setConfirmDelete(row._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={currentPage === i + 1 ? "active" : ""}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
      </div>

      {isEditing && (
        <div className="modal-overlay">
          <div className="modal wide professional">
            <div className="modal-header">
              <h2>Edit Inspection Record</h2>
              <button className="modal-close" onClick={() => setIsEditing(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-grid">
                {columns.map((col) => (
                  <div key={col} className="modal-field">
                    <label>{col.replace(/([A-Z])/g, " $1")}</label>
                    <input
                      type={dateFields.includes(col) ? "date" : numberFields.includes(col) ? "number" : "text"}
                      name={col}
                      value={
                        dateFields.includes(col) && formData[col]
                          ? (() => {
                              const dt = new Date(formData[col]);
                              return isNaN(dt.getTime()) ? "" : dt.toISOString().split("T")[0];
                            })()
                          : formData[col] ?? ""
                      }
                      onChange={handleChange}
                      className="field-input"
                    />
                  </div>
                ))}
                <div className="modal-field">
                  <label>Total Defects</label>
                  <input type="number" value={getTotalDefects(formData)} readOnly className="field-input" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="btn-save" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Confirmation"
          message="Are you sure you want to delete this inspection record?"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => { deleteInspection(confirmDelete); setConfirmDelete(null); }}
        />
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
