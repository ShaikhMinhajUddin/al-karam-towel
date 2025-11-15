import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Form from "./components/Form.jsx";
import Table from "./components/Table.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./components/Login.jsx";

export default function AppRoutes() {
  const [records, setRecords] = useState([]);

  const addRecord = (record) => setRecords((prev) => [...prev, record]);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<Dashboard data={records} />} />

        {/* Login Page */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/form"
          element={
            <ProtectedRoute>
              <Form onAdd={addRecord} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/table"
          element={
            <ProtectedRoute>
              <Table data={records} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
