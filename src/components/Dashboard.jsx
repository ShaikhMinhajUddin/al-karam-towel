// src/pages/InspectionDashboard.jsx
import { useEffect, useState, useMemo } from "react";
import { io } from "socket.io-client";
import "../components/Dashboard.css";
import html2canvas from "html2canvas";
import { useRef } from "react";
import Chatbot from '../components/Chatbot';



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
  // Sidebar open/close state (persisted in localStorage)
// InspectionDashboard.jsx
const sidebarOpen = true;


useEffect(() => {
  localStorage.setItem("sidebarOpen", JSON.stringify(sidebarOpen));
}, [sidebarOpen]);


  const [filters, setFilters] = useState({
    year: "All",
    month: "All",
    inspector: "All",
    status: "All",
      inspectionType: "All",
      customer: "All" // new filter
  });

  // WebSocket setup
  useEffect(() => {
    const socket = io("https://data-production-68c6.up.railway.app/api",
      //import.meta.env.VITE_API_BASE_URL, 
      { transports: ["websocket"] });
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
  month: (d.month || "Self Set").trim(),
  inspectionType: d.inspectionType?.trim() || null,
  inspectorName: d.inspectorName?.trim() || "Self Set",
  inspectionStatus: d.inspectionStatus?.trim() || "Self Set",
  year: d.year || new Date(d.inspectionDate).getFullYear(),




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
  oql: Number(d.actualOql || d.oql || 0),
  dpi: Number(d.dpi || 0),
}));


        setData(cleaned);
        setFilteredData(cleaned);
      })
      .catch(console.error)
      .finally(()=>setLoading(false));
  };

  useEffect(()=>{ fetchData() }, []);

  const handlePageSelect = (page) => {
    console.log("Navigating to:", page);
  };

  // Apply filters
  // Apply filters
useEffect(() => {
  let result = data;

  // Filter by year
  if (filters.year !== "All") result = result.filter(d => d.year === Number(filters.year));

  // Filter by month
  if (filters.month !== "All") result = result.filter(d => d.month === filters.month);

  // Filter by inspector
  if (filters.inspector !== "All") result = result.filter(d => d.inspectorName === filters.inspector);

  // Filter by status
  if (filters.status !== "All") {
    if (filters.status === "Pass") result = result.filter(d => d.inspectionStatus === "Pass" || d.inspectionStatus === "Passed");
    else if (filters.status === "Fail") result = result.filter(d => d.inspectionStatus === "Fail" || d.inspectionStatus === "Failed");
    else result = result.filter(d => d.inspectionStatus === filters.status);
  }

  // Filter by inspection type
 if (filters.inspectionType !== "All") {
  result = result.filter(d => d.inspectionType === filters.inspectionType);
}




  // Filter by customer (always independent)
  if (filters.customer !== "All") result = result.filter(d => d.customer === filters.customer);

  setFilteredData(result);
}, [filters, data]);


  // KPI metrics
  // Example changes inside KPI and chart components
// KPI metrics (inside useMemo)
const kpi = useMemo(() => {
  const total = filteredData.length;
  const totalPass = filteredData.reduce((s, d) => s + (d.pass || 0), 0);
  const totalFail = filteredData.reduce((s, d) => s + (d.fail || 0), 0);
  const totalAbort = filteredData.reduce((s, d) => s + (d.abort || 0), 0);
  const totalPending = filteredData.reduce((s, d) => s + (d.pending || 0), 0);
  const totalInspections = totalPass + totalFail + totalAbort + totalPending;
  const totalDefects = filteredData.reduce((sum, d) => sum + (d.actualMajor || 0), 0);

  const actualOql = filteredData.length
    ? (filteredData.reduce((sum, d) => sum + (d.actualOql || 0), 0) / filteredData.length)
        .toFixed(2)
    : "0.00";
  const passRate = totalInspections
    ? ((totalPass / totalInspections) * 100).toFixed(2)
    : "0.00";
  const failRate = totalInspections
    ? ((totalFail / totalInspections) * 100).toFixed(2)
    : "0.00";

  return {
    total,
    totalPass: totalPass,
    totalFail: totalFail,
    totalAbort: totalAbort.toFixed(2),
    totalPending: totalPending.toFixed(2),
    passRate,
    failRate,
    totalDefects: totalDefects,
    actualOql,
  };
}, [filteredData]);

// Tooltip labels inside charts (example for LineChart)
  <>
    // Tooltip labels inside charts (example for LineChart)
    <Tooltip
      contentStyle={{ backgroundColor: "#f9fafb", border: "1px solid #ddd", color: "#111" }}
      formatter={(value) => Number(value).toFixed(2)} />
    // Same for PieChart, BarChart labels
    <Bar dataKey="pass" fill="#22c55e" label={{ position: "top", fill: "#111", formatter: (val) => Number(val).toFixed(2) }} /><Bar dataKey="fail" fill="#ef4444" label={{ position: "top", fill: "#111", formatter: (val) => Number(val).toFixed(2) }} /></>


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

// OQL Trend per Month (CSV + Manual entries)
const oqlTrend = useMemo(() => {
  const grouped = {};

  filteredData.forEach(d => {
    const key = d.month || "Self Set";
    if (!grouped[key]) grouped[key] = { month: key, totalActualMajor: 0, totalSample: 0, totalOql: 0, countOql: 0 };

    // Manual entry: calculate weighted OQL
    grouped[key].totalActualMajor += Number(d.actualMajor || 0);
    grouped[key].totalSample += Number(d.sampleSize || 0);

    // CSV entry: use already calculated OQL if available
    if (d.actualOql || d.oql) {
      grouped[key].totalOql += Number(d.actualOql ?? d.oql ?? 0);
      grouped[key].countOql += 1;
    }
  });

  return Object.values(grouped).map(g => ({
    month: g.month,
    oql: g.countOql 
          ? (g.totalOql / g.countOql).toFixed(2)  // CSV OQL
          : (g.totalSample ? ((g.totalActualMajor / g.totalSample) * 100).toFixed(2) : 0) // Manual OQL
  }));
}, [filteredData]);





  // DPI Trend per Month
  // const dpiTrend = useMemo(() => {
  //   const grouped = {};
  //   filteredData.forEach(d=>{
  //     const key = d.month || "Self Set";
  //     if(!grouped[key]) grouped[key] = { month: key, dpi: 0 };
  //     grouped[key].dpi += d.dpi || 0;
  //   });
  //   return Object.values(grouped);
  // }, [filteredData]);

  const months = ["All", ...new Set(data.map(d=>d.month || "Self Set"))];
  const inspectors = ["All", ...new Set(data.map(d=>d.inspectorName || "Self Set"))];
  const inspectionTypes = ["All", ...Array.from(new Set(data.map(d => d.inspectionType).filter(Boolean)))];





  const statuses = ["All", ...new Set(data.map(d => {
  const raw = d.inspectionStatus || "Self Set";
  const status = raw.toLowerCase();
  if (status === "aborted") return null; // remove aborted
  if (status === "passed" || status === "pass") return "Pass";
  if (status === "failed" || status === "fail") return "Fail";
  return raw;
}).filter(Boolean))]; // remove nulls


  const years = ["All", ...new Set(data.map(d=>d.year))];

 if(loading) return (
  <div className="loading-screen">
    <div className="loader-bars">
      <div></div><div></div><div></div>
    </div>
  </div>
);





  return (
  <div className="flex">
    
  
    {/* Sidebar */}




   


    {/* Main Content */}
    <div className="flex flex-col p-8 min-h-screen" style={{ transition: "none", position: "relative", zIndex: 1 }}>

      {/* Filters */}
      <div className="filters-section">
        {[{ name: "year", label: "Year", options: years },
          { name: "month", label: "Month", options: months },
          { name: "status", label: "Status", options: statuses },
          { name: "inspectionType", label: "Inspection Type", options: inspectionTypes },
          { name: "customer", label: "Customer", options: ["All", ...Array.from(new Set(data.map(d => d.customer).filter(Boolean)))]}

        ].map(f => (
          <div key={f.name} className="filter-group">
            <label>{f.label}</label>
            <select
              value={filters[f.name]}
              onChange={e => setFilters({ ...filters, [f.name]: e.target.value })}
              className="filter-btn"
            >
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

      {/* KPI Section */}
      <div className="kpi-section">
        {[
          { title: "Total Inspections", value: kpi.total },
          { title: "Pass Inspections", value: kpi.totalPass },
          { title: "Fail Inspections", value: kpi.totalFail },
          { title: "Total Defects", value: kpi.totalDefects },
          { title: "Actual OQL", value: kpi.actualOql },
          { title: "Pass Rate (%)", value: kpi.passRate },
          { title: "Fail Rate (%)", value: kpi.failRate }
        ].map(c => (
          <div key={c.title} className="kpi-card">
            <h2 className="kpi-title">{c.title}</h2>
            <p className="kpi-value" style={{ color: c.title.includes("Fail") ? "#c21c1cff" : "#2ca514ff" }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <ChartCard title="Monthly Status Overview">
          <BarChartComponent data={monthlyStats} />
        </ChartCard>

        <ChartCard title="OQL By Month">
          <LineChartComponent
            data={oqlTrend}
            dataKeys={["oql"]}
            xKey="month"
            lineColors={["#22c55e"]}
            tooltipFormatter={(value) => Number(value).toFixed(2)}
            labelFormatter={(value) => Number(value).toFixed(2)}
          />
        </ChartCard>

        <ChartCard title="All Defects">
          <DefectsBarChart data={defectsDistribution} />
        </ChartCard>

        <ChartCard title="Defects Category">
          <CategoryRadarChart data={categoryRadarData} />
        </ChartCard>
      </div>
    </div>
    <Chatbot inspectionData={filteredData} />
  </div>
);

}

/* --- Subcomponents --- */
function ChartCard({ title, children, chartKpis=[] }) {
  const chartRef = useRef();

  const handleDownload = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement("a");
    link.download = `${title}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="ChartCard" style={{ 
  background: "#fff", 
  borderRadius: 12, 
  padding: 20, 
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  display: 'flex',
  flexDirection: 'column',
  height: '500px'  // ✅ Fixed height for card
}}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontWeight: 600, color:"#111", marginBottom:12 }}>{title}</h2>
        <button onClick={handleDownload} style={{ padding:"4px 8px", fontSize:12, borderRadius:6, background:"#3b82f6", color:"#fff" }}>Download</button>
      </div>
      
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

      {/* Chart wrapper ref */}
      <div ref={chartRef} style={{ flex: 1, minHeight: '400px' }}>
  <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
</div>
    </div>
  );
}


/* --- Chart Components --- */
function BarChartComponent({ data }){
  return(
    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
      <FixedXAxis dataKey="month" />
      <YAxis stroke="#555"/>
      <Tooltip contentStyle={{backgroundColor:"#f9fafb",border:"1px solid #ddd", borderRadius:6, color:"#111"}}/>
      <Legend />
      <Bar dataKey="pass" fill="#22c55e" label={{ position: "top", fill: "#111", formatter: (val) => Number(val).toFixed(0) }} />
      <Bar dataKey="fail" fill="#ef4444" label={{ position: "top", fill: "#111", formatter: (val) => Number(val).toFixed(0) }} />
      <Bar dataKey="abort" fill="#facc15" label={{ position: "top", fill: "#111", formatter: (val) => Number(val).toFixed(0) }} />
      <Bar dataKey="pending" fill="#3b82f6" label={{ position: "top", fill: "#111", formatter: (val) => Number(val).toFixed(0) }} />
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
    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
      <FixedXAxis dataKey="name" />
      <YAxis stroke="#555"/>
      <Tooltip contentStyle={{backgroundColor:"#f9fafb",border:"1px solid #ddd", borderRadius:6,color:"#111"}}/>
      <Legend />
      <Bar dataKey="Major" fill="#f87171" label={{ position: "top", fill: "#111", fontSize: 10, formatter: (val) => Number(val).toFixed(0) }} />
      <Bar dataKey="Minor" fill="#60a5fa" label={{ position: "top", fill: "#111", fontSize: 10, formatter: (val) => Number(val).toFixed(0) }} />
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
function LineChartComponent({ data, dataKeys, xKey = "month", lineColors=["#22c55e","#ef4444"], tooltipFormatter, labelFormatter }) {
  return (
    <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
      <FixedXAxis dataKey={xKey} />
      <YAxis stroke="#555" />
      <Tooltip
        contentStyle={{ backgroundColor: "#f9fafb", border: "1px solid #ddd", color:"#111" }}
        formatter={tooltipFormatter}
      />
      <Legend />
      {dataKeys.map((k, i) => (
        <Line
          key={i}
          type="monotone"
          dataKey={k}
          stroke={lineColors[i % lineColors.length]}
          strokeWidth={2}
          dot={{ fill: lineColors[i % lineColors.length], r: 4 }}
          label={{ position: "top", fill: "#111", fontSize: 10, formatter: labelFormatter }}
        />
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

// Fixed XAxis Component - LAST MEIN ADD KAREIN
function FixedXAxis({ dataKey, stroke = "#555" }) {
  return (
    <XAxis 
      dataKey={dataKey} 
      stroke={stroke}
      interval={0}
      angle={-45}
      textAnchor="end"
      height={80}
      tick={{ fontSize: 12 }}
    />
    
  );
}
