import React from "react";
import { FaHome, FaClipboardList, FaChartBar, FaFileExport, FaCog, FaUser } from "react-icons/fa";

export default function Sidebar({ isOpen }) {
  return (
    <div className={`fixed top-0 left-0 h-full w-64 bg-gray-800 text-white transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="flex items-center justify-center h-20 border-b border-gray-700">
        <h1 className="text-2xl font-bold">My Dashboard</h1>
      </div>
      <ul className="mt-6">
        <li className="flex items-center p-4 hover:bg-gray-700 cursor-pointer">
          <FaHome className="mr-3"/> Dashboard
        </li>
        <li className="flex items-center p-4 hover:bg-gray-700 cursor-pointer">
          <FaClipboardList className="mr-3"/> Inspections
        </li>
        <li className="flex items-center p-4 hover:bg-gray-700 cursor-pointer">
          <FaChartBar className="mr-3"/> Analytics
        </li>
        <li className="flex items-center p-4 hover:bg-gray-700 cursor-pointer">
          <FaFileExport className="mr-3"/> Reports
        </li>
        <li className="flex items-center p-4 hover:bg-gray-700 cursor-pointer">
          <FaCog className="mr-3"/> Settings
        </li>
      </ul>
      <div className="absolute bottom-0 w-full">
        <li className="flex items-center p-4 hover:bg-gray-700 cursor-pointer">
          <FaUser className="mr-3"/> Profile / Logout
        </li>
      </div>
    </div>
  );
}
