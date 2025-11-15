// src/pages/InspectionDashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import { io } from "socket.io-client";
import "../components/Dashboard.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import api from "../api";

export default function InspectionDashboard() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: "All",
    month: "All",
    inspector: "All",
    status: "All",
  });

  // WebSocket setup
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_BASE_URL, { transports: ["websocket"] });
    socket.on("inspection:update", fetchData);
    return () => socket.disconnect();
  }, []);

  // Fetch API data
  const fetchData = () => {
    setLoading(true);
    api.get("/inspections")
      .then((res) => {
        const sorted = res.data?.sort((a,b)=> new Date(a.inspectionDate)-new Date(b.inspectionDate));
        const cleaned = sorted.map(d => ({
          ...d,
          year: d.year || new Date(d.inspectionDate).getFullYear(),
          month: d.month || "Self Set",
          inspectorName: d.inspectorName || "Self Set",
          inspectionStatus: d.inspectionStatus || "Self Set",
          // Process fields
          lassar: Number(d.lassar || 0),
          patta: Number(d.patta || 0),
          shadeOut: Number(d.shadeOut || 0),
          pass: Number(d.pass || 0),
          fail: Number(d.fail || 0),
          abort: Number(d.abort || 0),
          pending: Number(d.pending || 0),
          major: Number(d.major || 0),
          minor: Number(d.minor || 0),
          critical: Number(d.critical || 0),
          oql: Number(d.oql || 0),
          dpi: Number(d.dpi || 0),
        }));
        setData(cleaned);
        setFilteredData(cleaned);
      })
      .catch(console.error)
      .finally(()=>setLoading(false));
  };

  useEffect(()=>{ fetchData() }, []);

  // Apply filters
  useEffect(() => {
    let result = data;
    if (filters.year !== "All") result = result.filter(d => d.year === Number(filters.year));
    if (filters.month !== "All") result = result.filter(d => d.month === filters.month);
    if (filters.inspector !== "All") result = result.filter(d => d.inspectorName === filters.inspector);
    if (filters.status !== "All") result = result.filter(d => {
      if(filters.status==="Pass") return d.inspectionStatus==="Passed" || d.inspectionStatus==="Pass";
      if(filters.status==="Fail") return d.inspectionStatus==="Failed" || d.inspectionStatus==="Fail";
      return d.inspectionStatus===filters.status;
    });
    setFilteredData(result);
  }, [filters, data]);

  // KPI metrics
  const kpi = useMemo(()=>{
    const total = filteredData.length;
    const totalPass = filteredData.reduce((s,d)=>s+(d.pass||0),0);
    const totalFail = filteredData.reduce((s,d)=>s+(d.fail||0),0);
    const totalAbort = filteredData.reduce((s,d)=>s+(d.abort||0),0);
    const totalPending = filteredData.reduce((s,d)=>s+(d.pending||0),0);
    const totalInspections = totalPass+totalFail+totalAbort+totalPending;
    const totalDefects = totalFail + totalAbort;
    const passRate = totalInspections ? ((totalPass/totalInspections)*100).toFixed(1):0;
    return { total, totalPass, totalFail, totalAbort, totalPending, passRate, totalDefects };
  }, [filteredData]);

  // Monthly summary
  const monthlyStats = useMemo(()=>{
    const grouped={};
    filteredData.forEach(d=>{
      const key=d.month||"Self Set";
      if(!grouped[key]) grouped[key]={month:key, pass:0, fail:0, abort:0, pending:0};
      grouped[key].pass += d.pass||0;
      grouped[key].fail += d.fail||0;
      grouped[key].abort += d.abort||0;
      grouped[key].pending += d.pending||0;
    });
    return Object.values(grouped);
  }, [filteredData]);

  // Defects by Category Radar
  const defectCategories = {
    Stitching: ["pulledTerry","rawEdge","weaving","uncutThread","stainMajor","skipStitch","brokenStitch","runoffStitch","poorShape","pleat","insecureLabel","missingLabel","slantLabel","damageFabric","hole","looseStitch","shortSize"],
    Workmanship: ["uncutThread","stainMinor","damageFabric","hole"],
    Process: ["lassar","patta","shadeOut"],
    Weaving: ["misPick","doublePick","flyYarn","contaminationMajor","contaminationMinor"]
  };

  const categoryRadarData = useMemo(() => {
    const sumField = (field) => filteredData.reduce((total, d) => total + Number(d[field] || 0), 0);

    return Object.entries(defectCategories).map(([category, fields]) => {
      const details = fields.map(f => ({ name: f, count: sumField(f) }));
      return {
        category,
        count: details.reduce((acc, d) => acc + d.count, 0),
        details: details.length > 0 ? details : [{ name: "No defects recorded", count: 0 }]
      };
    });
  }, [filteredData]);

  // Defects Distribution
  const defectsDistribution = useMemo(()=>{
    const allMajor=["pulledTerry","rawEdge","weaving","uncutThread","stainMajor","skipStitch","brokenStitch","runoffStitch","poorShape","pleat","insecureLabel","missingLabel","contaminationMajor","slantLabel","damageFabric","hole","looseStitch"];
    const allMinor=["singleUntrimmedThread","contaminationMinor","flyYarn","dustMark","stainMinor"];
    const sum=f=>filteredData.reduce((t,d)=>t+(d[f]||0),0);
    const majorData=allMajor.map(k=>({name:k, Major:sum(k)})).filter(x=>x.Major>0);
    const minorData=allMinor.map(k=>({name:k, Minor:sum(k)})).filter(x=>x.Minor>0);
    return [...majorData,...minorData];
  }, [filteredData]);

  // Pie chart
  const statusPie = useMemo(()=>[
    {name:"Pass", value:kpi.totalPass},
    {name:"Fail", value:kpi.totalFail},
    {name:"Pending", value:kpi.totalPending},
  ], [kpi]);

  // Inspector-based stats
  const inspectorStats = useMemo(()=>{
    const grouped = {};
    filteredData.forEach(d=>{
      const key = d.inspectorName || "Self Set";
      if(!grouped[key]) grouped[key] = { inspectorName: key, pass: 0, fail: 0 };
      grouped[key].pass += d.pass || 0;
      grouped[key].fail += d.fail || 0;
    });
    return Object.values(grouped);
  }, [filteredData]);

  // Critical trend
  const criticalTrend = useMemo(()=>{
    const grouped={};
    filteredData.forEach(d=>{
      const key=d.month||"Self Set";
      if(!grouped[key]) grouped[key]={month:key, critical:0};
      grouped[key].critical += d.critical || 0;
    });
    return Object.values(grouped);
  }, [filteredData]);

  // Major vs Minor Ratio
  const defectsRatio = useMemo(()=>{
    const grouped={};
    filteredData.forEach(d=>{
      const key=d.month||"Self Set";
      if(!grouped[key]) grouped[key]={month:key, Major:0, Minor:0};
      grouped[key].Major += d.major || 0;
      grouped[key].Minor += d.minor || 0;
    });
    return Object.values(grouped);
  }, [filteredData]);

  // Status Trend (Abort & Pending)
  const statusTrend = useMemo(()=>{
    const grouped={};
    filteredData.forEach(d=>{
      const key=d.month||"Self Set";
      if(!grouped[key]) grouped[key]={month:key, abort:0, pending:0};
      grouped[key].abort += d.abort||0;
      grouped[key].pending += d.pending||0;
    });
    return Object.values(grouped);
  }, [filteredData]);

  // OQL Trend per Month
  const oqlTrend = useMemo(() => {
    const grouped = {};
    filteredData.forEach(d=>{
      const key = d.month || "Self Set";
      if(!grouped[key]) grouped[key] = { month: key, oql: 0 };
      grouped[key].oql += d.oql || 0;
    });
    return Object.values(grouped);
  }, [filteredData]);

  // DPI Trend per Month
  const dpiTrend = useMemo(() => {
    const grouped = {};
    filteredData.forEach(d=>{
      const key = d.month || "Self Set";
      if(!grouped[key]) grouped[key] = { month: key, dpi: 0 };
      grouped[key].dpi += d.dpi || 0;
    });
    return Object.values(grouped);
  }, [filteredData]);

  const months = ["All", ...new Set(data.map(d=>d.month || "Self Set"))];
  const inspectors = ["All", ...new Set(data.map(d=>d.inspectorName || "Self Set"))];
  const statuses = ["All", ...new Set(data.map(d => {
  const raw = d.inspectionStatus || "Self Set";
  const status = raw.toLowerCase();
  if (status === "aborted") return null; // remove aborted
  if (status === "passed" || status === "pass") return "Pass";
  if (status === "failed" || status === "fail") return "Fail";
  return raw;
}).filter(Boolean))]; // remove nulls


  const years = ["All", ...new Set(data.map(d=>d.year))];

  if(loading) return <div className="text-center text-gray-400 p-20 text-xl">Loading...</div>;

  return (
    <div className="flex flex-col p-8 min-h-screen bg-white text-gray-900 font-sans gap-8">
      {/* Filters */}
      <div className="filters-section">
        {[{ name: "year", label: "Year", options: years },
          { name: "month", label: "Month", options: months },
          { name: "status", label: "Status", options: statuses }
        ].map(f=>(
          <div key={f.name} className="filter-group">
            <label>{f.label}</label>
            <select value={filters[f.name]} onChange={e=>setFilters({...filters,[f.name]:e.target.value})} className="filter-btn">
              {f.options.map(opt => {
                let label = opt;
                if (f.name === "status") {
                  if (opt === "Passed") label = "Pass";
                  else if (opt === "Failed") label = "Fail";
                }
                return <option key={opt} value={opt}>{label}</option>;
              })}
            </select>
          </div>
        ))}
      </div>

      {/* KPI */}
      <div className="kpi-section">
        {[
          {title:"Total Inspections", value:kpi.total},
          {title:"Pass Inspections", value:kpi.totalPass},
          {title:"Fail Inspections", value:kpi.totalFail},
          {title:"Total Defects", value:kpi.totalDefects},
          {title:"OQL", value:kpi.totalAbort},
          {title:"Fail Rate (%)", value:kpi.totalFail},
          {title:"Pass Rate (%)", value:kpi.passRate}
        ].map(c=>(
          <div key={c.title} className="kpi-card">
            <h2 className="kpi-title">{c.title}</h2>
            <p className="kpi-value">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-section">
        <ChartCard title="OQL Trend per Month"><LineChartComponent data={oqlTrend} dataKeys={["oql"]} xKey="month" lineColors={["#22c55e"]}/></ChartCard>
        <ChartCard title="Defects by Category"><CategoryRadarChart data={categoryRadarData}/></ChartCard>
        <ChartCard title="DPI Trend per Month"><LineChartComponent data={dpiTrend} dataKeys={["dpi"]} xKey="month" lineColors={["#3b82f6"]}/></ChartCard>
        <ChartCard title="Monthly Status Overview"><BarChartComponent data={monthlyStats}/></ChartCard>
        <ChartCard title="Defects Distribution" chartKpis={[]}><DefectsBarChart data={defectsDistribution}/></ChartCard>
        
       
      </div>
    </div>
  );
}

/* --- Subcomponents --- */
function ChartCard({ title, children, chartKpis=[] }) {
  return (
    <div className="ChartCard" style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
      <h2 style={{ fontWeight: 600, color:"#111", marginBottom:12 }}>{title}</h2>
      {chartKpis.length>0 && (
        <div className="chart-kpis" style={{ display:"flex", gap:16, marginBottom:12 }}>
          {chartKpis.map((c,i)=>(
            <div key={i} className="kpi-small">
              <div className="title" style={{ fontSize:12, color:"#555" }}>{c.title}</div>
              <div className="value" style={{ fontWeight:600, fontSize:16 }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}
      <ResponsiveContainer width="100%" height={300}>{children}</ResponsiveContainer>
    </div>
  );
}

/* --- Chart Components --- */
function BarChartComponent({ data }){
  return(
    <BarChart data={data}>
      <XAxis dataKey="month" stroke="#555"/>
      <YAxis stroke="#555"/>
      <Tooltip contentStyle={{backgroundColor:"#f9fafb",border:"1px solid #ddd", borderRadius:6, color:"#111"}}/>
      <Legend />
      <Bar dataKey="pass" fill="#22c55e" label={{position:"top",fill:"#111"}}/>
      <Bar dataKey="fail" fill="#ef4444" label={{position:"top",fill:"#111"}}/>
      <Bar dataKey="abort" fill="#facc15" label={{position:"top",fill:"#111"}}/>
      <Bar dataKey="pending" fill="#3b82f6" label={{position:"top",fill:"#111"}}/>
    </BarChart>
  );
}
function CategoryRadarChart({ data }) {
  return (
    <RadarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
      <PolarGrid stroke="#ddd"/>
      <PolarAngleAxis dataKey="category" stroke="#555"/>
      <PolarRadiusAxis stroke="#aaa"/>
      <Radar dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6}/>
      <Tooltip wrapperStyle={{ background: "#f9fafb", color: "#111", borderRadius:6, padding:10 }}
        content={({ payload }) => {
          if (!payload || !payload.length) return null;
          const categoryItem = payload[0].payload;
          return (
            <div style={{ color: "#111" }}>
              <strong>{categoryItem.category}</strong>
              <div style={{ marginTop:5 }}>
                {categoryItem.details.length > 0 
                  ? categoryItem.details.map(d => (<div key={d.name}>{d.name}: {d.count}</div>))
                  : <div>No defects recorded</div>}
              </div>
            </div>
          );
        }}
      />
    </RadarChart>
  );
}
function DefectsBarChart({ data }){
  return(
    <BarChart data={data}>
      <XAxis dataKey="name" stroke="#555" tick={{fontSize:10}}/>
      <YAxis stroke="#555"/>
      <Tooltip contentStyle={{backgroundColor:"#f9fafb",border:"1px solid #ddd", borderRadius:6,color:"#111"}}/>
      <Legend />
      <Bar dataKey="Major" fill="#f87171" label={{position:"top",fill:"#111",fontSize:10}}/>
      <Bar dataKey="Minor" fill="#60a5fa" label={{position:"top",fill:"#111",fontSize:10}}/>
    </BarChart>
  );
}
function PieChartComponent({ data }){
  const COLORS=["#22c55e","#ef4444","#facc15","#3b82f6"];
  return(
    <PieChart>
      <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}
        label={({name,value})=>`${name}: ${value}`}>
        {data.map((_,i)=><Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
      </Pie>
      <Tooltip contentStyle={{backgroundColor:"#f9fafb",border:"1px solid #ddd", color:"#111"}}/>
    </PieChart>
  );
}
function LineChartComponent({ data, dataKeys, xKey = "month", lineColors=["#22c55e","#ef4444"] }) {
  return (
    <LineChart data={data}>
      <XAxis dataKey={xKey} stroke="#555" />
      <YAxis stroke="#555" />
      <Tooltip contentStyle={{ backgroundColor: "#f9fafb", border: "1px solid #ddd", color:"#111" }} />
      <Legend />
      {dataKeys.map((k, i) => (
        <Line key={i} type="monotone" dataKey={k} stroke={lineColors[i % lineColors.length]} strokeWidth={2} label={{position:"top",fill:"#111",fontSize:12}}/>
      ))}
    </LineChart>
  );
}
function StackedBarChartComponent({ data, keys }){
  return(
    <BarChart data={data}>
      <XAxis dataKey="month" stroke="#555" />
      <YAxis stroke="#555" />
      <Tooltip contentStyle={{ backgroundColor: "#f9fafb", border: "1px solid #ddd", color:"#111" }} />
      <Legend />
      {keys.map((k,i)=><Bar key={i} dataKey={k} stackId="a" fill={i===0?"#f87171":"#60a5fa"} label={{position:"top",fill:"#111"}}/>)}
    </BarChart>
  );
}
