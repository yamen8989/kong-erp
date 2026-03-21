import { useState, useEffect, useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// ⚙️  STEP 1: Paste your Supabase credentials here after creating your project
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL  = "https://elyzbvmsinldegiwnjtc.supabase.co";   // ← replace this
const SUPABASE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseXpidm1zaW5sZGVnaXduanRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzU5MDgsImV4cCI6MjA4OTY1MTkwOH0.yiTJA7RKOgdfHh9DFbd4E5aLUs_VnCghw4xm1ORs7t4";                  // ← replace this

// ─────────────────────────────────────────────────────────────────────────────
const PRODUCTS = [
  { id:1,  name:"Kong Extreme Small Second",             cost:2.60,  sell:6.00  },
  { id:2,  name:"Kong Extreme Medium Second",            cost:3.66,  sell:8.00  },
  { id:3,  name:"Kong Extreme Large Second",             cost:5.24,  sell:11.00 },
  { id:4,  name:"Kong Medium Second",                    cost:3.66,  sell:8.00  },
  { id:5,  name:"Kong Large Second",                     cost:5.24,  sell:11.00 },
  { id:6,  name:"Kong Extreme Goodie Bone Black L",      cost:15.19, sell:30.00 },
  { id:7,  name:"Kong Extreme Black (L)",                cost:12.40, sell:25.00 },
  { id:8,  name:"Kong Extreme Black (M)",                cost:10.97, sell:20.00 },
  { id:9,  name:"Kong Extreme Tires (M/L)",              cost:9.94,  sell:20.00 },
  { id:10, name:"Kong Extreme (XL)",                     cost:18.54, sell:30.00 },
  { id:11, name:"Kong Signature Ball Bulk (L)",          cost:5.74,  sell:10.00 },
  { id:12, name:"Kong Maxx Tug (L)",                     cost:10.63, sell:20.00 },
  { id:13, name:"Kong Reflex Ball (L)",                  cost:7.83,  sell:15.00 },
  { id:14, name:"Flexi Classic L Tape (8m/50kg) Black",  cost:22.58, sell:40.00 },
  { id:15, name:"Flexi Classic M Tape (5m/25kg) Black",  cost:14.84, sell:25.00 },
];

const SOURCES = ["Instagram","WhatsApp","In-Person","Website","Other"];
const PALETTE = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#14b8a6","#f97316","#6366f1","#84cc16","#a855f7","#0ea5e9","#f43f5e","#22d3ee"];

const $   = (n) => "$" + Number(n).toFixed(2);
const f2  = (n) => Number(n).toFixed(2);
const today = () => new Date().toISOString().split("T")[0];

// ─── Supabase helpers ──────────────────────────────────────────────────────
const sb = {
  async get(table) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=id.asc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async insert(table, row) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(row)
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    return Array.isArray(data) ? data[0] : data;
  },
  async del(table, id) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if (!r.ok) throw new Error(await r.text());
  }
};

// ─── UI Primitives ────────────────────────────────────────────────────────
const inputSt  = { width:"100%", padding:"9px 12px", border:"1.5px solid #d1d5db", borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", background:"#fff", fontFamily:"inherit" };
const selectSt = { ...inputSt, cursor:"pointer" };

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:5 }}>{label}</label>
      {children}
    </div>
  );
}

function Btn({ label, color="#2563eb", onClick, disabled, full=true }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background:disabled?"#9ca3af":color, color:"#fff", border:"none", borderRadius:9,
               padding:"10px 22px", fontSize:14, fontWeight:600, cursor:disabled?"not-allowed":"pointer",
               width:full?"100%":"auto", fontFamily:"inherit" }}>
      {label}
    </button>
  );
}

function Spinner() {
  return <span style={{ display:"inline-block", width:16, height:16, border:"2px solid #e2e8f0", borderTop:"2px solid #3b82f6", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>;
}

function KpiCard({ label, value, sub, scheme }) {
  const s = { green:{bg:"#f0fdf4",bd:"#bbf7d0",lbl:"#15803d",val:"#14532d"}, red:{bg:"#fef2f2",bd:"#fecaca",lbl:"#dc2626",val:"#7f1d1d"}, blue:{bg:"#eff6ff",bd:"#bfdbfe",lbl:"#1d4ed8",val:"#1e3a8a"}, purple:{bg:"#f5f3ff",bd:"#ddd6fe",lbl:"#7c3aed",val:"#3b0764"}, amber:{bg:"#fffbeb",bd:"#fde68a",lbl:"#d97706",val:"#78350f"} }[scheme]||{bg:"#f8fafc",bd:"#e2e8f0",lbl:"#475569",val:"#0f172a"};
  return (
    <div style={{ background:s.bg, border:`1.5px solid ${s.bd}`, borderRadius:14, padding:"16px 18px", minWidth:0 }}>
      <div style={{ fontSize:11, color:s.lbl, fontWeight:700, marginBottom:5, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:800, color:s.val, lineHeight:1.1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:s.lbl, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function SourceBadge({ src }) {
  const m = { Instagram:["#eff6ff","#1d4ed8"], WhatsApp:["#f0fdf4","#15803d"], "In-Person":["#fdf4ff","#7e22ce"], Website:["#fff7ed","#c2410c"], Other:["#f9fafb","#4b5563"] };
  const [bg,fg] = m[src]||m.Other;
  return <span style={{ background:bg, color:fg, fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:20, whiteSpace:"nowrap" }}>{src}</span>;
}

function StockBadge({ n }) {
  if (n<=0) return <span style={{ background:"#fef2f2", color:"#dc2626", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20 }}>Out of stock</span>;
  if (n<=3) return <span style={{ background:"#fffbeb", color:"#d97706", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20 }}>Low stock</span>;
  return       <span style={{ background:"#f0fdf4", color:"#15803d", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20 }}>In stock</span>;
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px 0" }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:700 }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#6b7280" }}>×</button>
        </div>
        <div style={{ padding:"16px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

function Toast({ msg, type }) {
  const bg = type==="error"?"#fef2f2":type==="loading"?"#eff6ff":"#f0fdf4";
  const cl = type==="error"?"#dc2626":type==="loading"?"#2563eb":"#16a34a";
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:2000, background:bg, border:`1.5px solid ${cl}30`, borderRadius:12, padding:"12px 18px", fontSize:13, fontWeight:600, color:cl, display:"flex", alignItems:"center", gap:8, boxShadow:"0 4px 20px rgba(0,0,0,0.12)" }}>
      {type==="loading"&&<Spinner/>}
      {type==="success"&&"✓"} {type==="error"&&"✗"} {msg}
    </div>
  );
}

// ─── Add Purchase Modal ────────────────────────────────────────────────────
function AddPurchase({ onSave, onClose }) {
  const [f, setF] = useState({ date:today(), pid:"", qty:"", cost:"", notes:"" });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setF(x=>({...x,[k]:v}));
  const prod = PRODUCTS.find(p=>p.id===Number(f.pid));
  const handleProd = id => { const p=PRODUCTS.find(x=>x.id===Number(id)); setF(x=>({...x,pid:id,cost:p?f2(p.cost):""})); };
  const total = f.qty&&f.cost ? (parseFloat(f.qty)*parseFloat(f.cost)).toFixed(2) : null;
  const valid = f.date&&f.pid&&f.qty>0&&f.cost>0;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    await onSave({ date:f.date, product_id:Number(f.pid), product_name:prod.name, qty:Number(f.qty), cost:Number(f.cost), total:Number(total), notes:f.notes });
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="📦 Add Purchase" onClose={onClose}>
      <Field label="Date"><input type="date" value={f.date} onChange={e=>set("date",e.target.value)} style={inputSt}/></Field>
      <Field label="Product">
        <select value={f.pid} onChange={e=>handleProd(e.target.value)} style={selectSt}>
          <option value="">— Select product —</option>
          {PRODUCTS.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Field label="Quantity"><input type="number" min="1" placeholder="0" value={f.qty} onChange={e=>set("qty",e.target.value)} style={inputSt}/></Field>
        <Field label="Unit Cost ($)"><input type="number" min="0" step="0.01" placeholder="0.00" value={f.cost} onChange={e=>set("cost",e.target.value)} style={inputSt}/></Field>
      </div>
      {total && (
        <div style={{ background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:10, padding:"10px 14px", marginBottom:14, display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:13, color:"#15803d", fontWeight:600 }}>Total Cost</span>
          <span style={{ fontSize:20, fontWeight:800, color:"#14532d" }}>${total}</span>
        </div>
      )}
      <Field label="Supplier / Notes (optional)"><input type="text" placeholder="e.g. Supplier name..." value={f.notes} onChange={e=>set("notes",e.target.value)} style={inputSt}/></Field>
      <Btn label={saving?"Saving...":"✓ Save Purchase"} color={valid?"#16a34a":"#9ca3af"} onClick={submit} disabled={!valid||saving}/>
    </Modal>
  );
}

// ─── Add Sale Modal ────────────────────────────────────────────────────────
function AddSale({ onSave, onClose, inventory }) {
  const [f, setF] = useState({ date:today(), pid:"", qty:"", price:"", client:"", source:"", notes:"" });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setF(x=>({...x,[k]:v}));
  const prod = PRODUCTS.find(p=>p.id===Number(f.pid));
  const stock = inventory[Number(f.pid)]||0;
  const handleProd = id => { const p=PRODUCTS.find(x=>x.id===Number(id)); setF(x=>({...x,pid:id,price:p?f2(p.sell):""})); };
  const total = f.qty&&f.price ? (parseFloat(f.qty)*parseFloat(f.price)).toFixed(2) : null;
  const over  = f.qty && Number(f.qty)>stock;
  const valid = f.date&&f.pid&&f.qty>0&&f.price>0&&!over;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    await onSave({ date:f.date, product_id:Number(f.pid), product_name:prod.name, qty:Number(f.qty), price:Number(f.price), total:Number(total), client:f.client, source:f.source, notes:f.notes });
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="💰 Record New Sale" onClose={onClose}>
      <Field label="Date"><input type="date" value={f.date} onChange={e=>set("date",e.target.value)} style={inputSt}/></Field>
      <Field label="Product">
        <select value={f.pid} onChange={e=>handleProd(e.target.value)} style={selectSt}>
          <option value="">— Select product —</option>
          {PRODUCTS.map(p=><option key={p.id} value={p.id}>{p.name} {inventory[p.id]!=null?`(${inventory[p.id]} left)`:""}</option>)}
        </select>
      </Field>
      {f.pid && <div style={{ background:"#eff6ff", borderRadius:8, padding:"6px 12px", marginBottom:10, fontSize:12, color:"#1d4ed8" }}>Stock available: <strong>{stock} units</strong></div>}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Field label="Quantity"><input type="number" min="1" placeholder="0" value={f.qty} onChange={e=>set("qty",e.target.value)} style={{...inputSt,borderColor:over?"#ef4444":"#d1d5db"}}/></Field>
        <Field label="Selling Price ($)"><input type="number" min="0" step="0.01" placeholder="0.00" value={f.price} onChange={e=>set("price",e.target.value)} style={inputSt}/></Field>
      </div>
      {over && <div style={{ color:"#dc2626", fontSize:12, marginBottom:10, fontWeight:600 }}>⚠️ Quantity exceeds available stock ({stock} units)</div>}
      {total&&!over && (
        <div style={{ background:"#fffbeb", border:"1.5px solid #fde68a", borderRadius:10, padding:"10px 14px", marginBottom:14, display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:13, color:"#d97706", fontWeight:600 }}>Total Revenue</span>
          <span style={{ fontSize:20, fontWeight:800, color:"#78350f" }}>${total}</span>
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Field label="Client Name (optional)"><input type="text" placeholder="Client name..." value={f.client} onChange={e=>set("client",e.target.value)} style={inputSt}/></Field>
        <Field label="Source"><select value={f.source} onChange={e=>set("source",e.target.value)} style={selectSt}><option value="">— Select —</option>{SOURCES.map(s=><option key={s} value={s}>{s}</option>)}</select></Field>
      </div>
      <Field label="Notes (optional)"><input type="text" placeholder="Any note..." value={f.notes} onChange={e=>set("notes",e.target.value)} style={inputSt}/></Field>
      <Btn label={saving?"Saving...":"✓ Save Sale"} color={valid?"#2563eb":"#9ca3af"} onClick={submit} disabled={!valid||saving}/>
    </Modal>
  );
}

const tdSt = i => ({ padding:"10px 14px", background:i%2===0?"#f8fafc":"#fff", borderBottom:"1px solid #f1f5f9" });

function THead({ cols }) {
  return <thead><tr style={{ background:"#0f172a", color:"#fff" }}>{cols.map(c=><th key={c} style={{ padding:"12px 14px", textAlign:"left", fontWeight:600, fontSize:12, whiteSpace:"nowrap" }}>{c}</th>)}</tr></thead>;
}

// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [purchases, setPurchases] = useState([]);
  const [sales,     setSales]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToast]     = useState(null);
  const [page,      setPage]      = useState("dashboard");
  const [modal,     setModal]     = useState(null);

  const showToast = (msg, type="success", ms=2500) => {
    setToast({msg,type});
    if (type!=="loading") setTimeout(()=>setToast(null), ms);
  };

  // ── Load data from Supabase ───────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [p, s] = await Promise.all([sb.get("purchases"), sb.get("sales")]);
      setPurchases(p); setSales(s);
    } catch(e) {
      showToast("Connection error — check your Supabase credentials", "error", 6000);
    } finally { setLoading(false); }
  }, []);

  useEffect(()=>{ loadData(); }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const addPurchase = async (row) => {
    showToast("Saving...", "loading");
    try {
      const saved = await sb.insert("purchases", { ...row, id: Date.now() });
      setPurchases(p=>[...p, saved]);
      showToast("Purchase saved ✓");
    } catch { showToast("Failed to save", "error"); }
  };

  const addSale = async (row) => {
    showToast("Saving...", "loading");
    try {
      const saved = await sb.insert("sales", { ...row, id: Date.now() });
      setSales(s=>[...s, saved]);
      showToast("Sale recorded ✓");
    } catch { showToast("Failed to save", "error"); }
  };

  const delRecord = async (type, id) => {
    showToast("Deleting...", "loading");
    try {
      await sb.del(type, id);
      if (type==="purchases") setPurchases(p=>p.filter(r=>r.id!==id));
      else setSales(s=>s.filter(r=>r.id!==id));
      showToast("Deleted");
    } catch { showToast("Failed to delete", "error"); }
    setModal(null);
  };

  // ── Computed ─────────────────────────────────────────────────────────────
  const inventory = useMemo(()=>{
    const inv={}; PRODUCTS.forEach(p=>{inv[p.id]=0;});
    purchases.forEach(r=>{inv[r.product_id]=(inv[r.product_id]||0)+r.qty;});
    sales.forEach(r    =>{inv[r.product_id]=(inv[r.product_id]||0)-r.qty;});
    return inv;
  },[purchases,sales]);

  const totalRev  = sales.reduce((s,r)=>s+r.total,0);
  const totalCost = purchases.reduce((s,r)=>s+r.total,0);
  const profit    = totalRev-totalCost;
  const margin    = totalRev>0?profit/totalRev*100:0;
  const unitsSold = sales.reduce((s,r)=>s+r.qty,0);

  const prodStats = useMemo(()=>PRODUCTS.map(p=>{
    const purQ=purchases.filter(r=>r.product_id===p.id).reduce((s,r)=>s+r.qty,0);
    const salQ=sales.filter(r=>r.product_id===p.id).reduce((s,r)=>s+r.qty,0);
    const rev =sales.filter(r=>r.product_id===p.id).reduce((s,r)=>s+r.total,0);
    return {...p,purQ,salQ,rev,profit:rev-salQ*p.cost,stock:inventory[p.id]};
  }),[purchases,sales,inventory]);

  const sourcePie = useMemo(()=>SOURCES.map(s=>({
    name:s,orders:sales.filter(r=>r.source===s).length,
    revenue:sales.filter(r=>r.source===s).reduce((t,r)=>t+r.total,0),
  })).filter(s=>s.orders>0),[sales]);

  const topProds = [...prodStats].sort((a,b)=>b.rev-a.rev).filter(p=>p.rev>0).slice(0,7);
  const lowStock = prodStats.filter(p=>p.stock<=3);

  const NAV = [
    {id:"dashboard",icon:"◈",label:"Dashboard"},
    {id:"inventory", icon:"▦",label:"Inventory"},
    {id:"purchases", icon:"↓",label:"Purchases"},
    {id:"sales",     icon:"↑",label:"Sales"},
    {id:"products",  icon:"≡",label:"Products"},
  ];

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", gap:16, fontFamily:"sans-serif" }}>
      <Spinner/>
      <p style={{ color:"#64748b", fontSize:14 }}>Connecting to database...</p>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Segoe UI',Arial,sans-serif", minHeight:"100vh", background:"#f1f5f9" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── NAV ── */}
      <div style={{ background:"#0f172a", color:"#fff", display:"flex", alignItems:"center", padding:"0 16px", position:"sticky", top:0, zIndex:200, boxShadow:"0 2px 12px rgba(0,0,0,0.25)" }}>
        <div style={{ fontWeight:800, fontSize:15, color:"#f8fafc", marginRight:20, padding:"14px 0", whiteSpace:"nowrap" }}>🐾 Kong & Flexi ERP</div>
        <div style={{ display:"flex", flex:1, overflowX:"auto" }}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setPage(n.id)}
              style={{ background:"none", border:"none", color:page===n.id?"#fff":"#94a3b8", fontWeight:page===n.id?700:400, fontSize:13, padding:"16px 13px", cursor:"pointer", borderBottom:page===n.id?"3px solid #3b82f6":"3px solid transparent", whiteSpace:"nowrap", fontFamily:"inherit" }}>
              {n.icon} {n.label}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:8, marginLeft:8 }}>
          <button onClick={()=>setModal("purchase")} style={{ background:"#16a34a", color:"#fff", border:"none", borderRadius:8, padding:"8px 14px", fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>+ Purchase</button>
          <button onClick={()=>setModal("sale")}     style={{ background:"#2563eb", color:"#fff", border:"none", borderRadius:8, padding:"8px 14px", fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>+ Sale</button>
        </div>
      </div>

      <div style={{ padding:"22px 20px 48px", maxWidth:1120, margin:"0 auto" }}>

        {/* ═══ DASHBOARD ═══ */}
        {page==="dashboard" && <>
          <h2 style={{ margin:"0 0 16px", fontWeight:800, color:"#0f172a", fontSize:20 }}>Dashboard</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))", gap:12, marginBottom:20 }}>
            <KpiCard label="Total Revenue" value={$(totalRev)}           scheme="green"/>
            <KpiCard label="Total Cost"    value={$(totalCost)}          scheme="red"/>
            <KpiCard label="Gross Profit"  value={$(profit)}             scheme="blue" sub={profit>=0?"▲ Profit":"▼ Loss"}/>
            <KpiCard label="Profit Margin" value={margin.toFixed(1)+"%"} scheme="purple"/>
            <KpiCard label="Total Sales"   value={sales.length}          scheme="amber" sub={unitsSold+" units sold"}/>
          </div>

          {lowStock.length>0 && (
            <div style={{ background:"#fff7ed", border:"1.5px solid #fed7aa", borderRadius:12, padding:"12px 16px", marginBottom:18 }}>
              <div style={{ fontWeight:700, color:"#c2410c", fontSize:13, marginBottom:8 }}>⚠️ Reorder Alert</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {lowStock.map(p=>(
                  <span key={p.id} style={{ background:p.stock<=0?"#fef2f2":"#fffbeb", color:p.stock<=0?"#dc2626":"#d97706", fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:20, border:`1px solid ${p.stock<=0?"#fecaca":"#fde68a"}` }}>
                    {p.name} — {p.stock} left
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:18 }}>
            <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e2e8f0", padding:"16px 16px 10px" }}>
              <div style={{ fontWeight:700, color:"#0f172a", marginBottom:12, fontSize:14 }}>🏆 Top Products by Revenue</div>
              {topProds.length===0
                ? <div style={{ color:"#94a3b8", fontSize:13, padding:"28px 0", textAlign:"center" }}>No sales yet</div>
                : <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={topProds} layout="vertical" margin={{left:0,right:24,top:4,bottom:4}}>
                      <XAxis type="number" tick={{fontSize:10}} tickFormatter={v=>"$"+v}/>
                      <YAxis type="category" dataKey="name" width={145} tick={{fontSize:9}}/>
                      <Tooltip formatter={v=>["$"+v.toFixed(2),"Revenue"]}/>
                      <Bar dataKey="rev" radius={[0,5,5,0]}>{topProds.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
              }
            </div>
            <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e2e8f0", padding:"16px 16px 10px" }}>
              <div style={{ fontWeight:700, color:"#0f172a", marginBottom:12, fontSize:14 }}>📲 Sales by Channel</div>
              {sourcePie.length===0
                ? <div style={{ color:"#94a3b8", fontSize:13, padding:"28px 0", textAlign:"center" }}>No sales yet</div>
                : <>
                    <ResponsiveContainer width="100%" height={170}>
                      <PieChart>
                        <Pie data={sourcePie} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={72} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                          {sourcePie.map((_,i)=><Cell key={i} fill={PALETTE[i]}/>)}
                        </Pie>
                        <Tooltip formatter={v=>["$"+v.toFixed(2),"Revenue"]}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
                      {sourcePie.map((s,i)=>(
                        <span key={s.name} style={{ fontSize:11, color:"#475569", display:"flex", alignItems:"center", gap:4 }}>
                          <span style={{ width:9,height:9,borderRadius:2,background:PALETTE[i],display:"inline-block" }}/>
                          {s.name}: {$(s.revenue)}
                        </span>
                      ))}
                    </div>
                  </>
              }
            </div>
          </div>

          <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e2e8f0", padding:16 }}>
            <div style={{ fontWeight:700, color:"#0f172a", marginBottom:12, fontSize:14 }}>🕐 Recent Sales</div>
            {sales.length===0
              ? <div style={{ color:"#94a3b8", fontSize:13, textAlign:"center", padding:"20px 0" }}>No sales yet — click "+ Sale"</div>
              : <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <THead cols={["Date","Product","Qty","Revenue","Client","Source"]}/>
                    <tbody>
                      {[...sales].reverse().slice(0,8).map((r,i)=>(
                        <tr key={r.id}>
                          <td style={tdSt(i)}><span style={{ fontSize:12,color:"#64748b" }}>{r.date}</span></td>
                          <td style={tdSt(i)}><span style={{ fontWeight:500 }}>{r.product_name}</span></td>
                          <td style={{...tdSt(i),textAlign:"center"}}>{r.qty}</td>
                          <td style={tdSt(i)}><span style={{ color:"#16a34a",fontWeight:700 }}>{$(r.total)}</span></td>
                          <td style={tdSt(i)}><span style={{ color:"#64748b" }}>{r.client||"—"}</span></td>
                          <td style={tdSt(i)}>{r.source?<SourceBadge src={r.source}/>:"—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </div>
        </>}

        {/* ═══ INVENTORY ═══ */}
        {page==="inventory" && <>
          <h2 style={{ margin:"0 0 16px", fontWeight:800, color:"#0f172a", fontSize:20 }}>📦 Live Inventory</h2>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, background:"#fff", borderRadius:14, overflow:"hidden", border:"1px solid #e2e8f0" }}>
              <THead cols={["Product","Cost","Sell","Margin","Purchased","Sold","Stock","Status"]}/>
              <tbody>
                {prodStats.map((p,i)=>(
                  <tr key={p.id}>
                    <td style={tdSt(i)}><span style={{ fontWeight:500 }}>{p.name}</span></td>
                    <td style={tdSt(i)}><span style={{ color:"#dc2626" }}>{$(p.cost)}</span></td>
                    <td style={tdSt(i)}><span style={{ color:"#16a34a" }}>{$(p.sell)}</span></td>
                    <td style={tdSt(i)}><span style={{ color:"#2563eb",fontWeight:700 }}>{$(p.sell-p.cost)}</span></td>
                    <td style={{...tdSt(i),textAlign:"center"}}>{p.purQ}</td>
                    <td style={{...tdSt(i),textAlign:"center"}}>{p.salQ}</td>
                    <td style={{...tdSt(i),textAlign:"center",fontWeight:800,fontSize:14,color:p.stock<=0?"#dc2626":p.stock<=3?"#d97706":"#15803d"}}>{p.stock}</td>
                    <td style={tdSt(i)}><StockBadge n={p.stock}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>}

        {/* ═══ PURCHASES ═══ */}
        {page==="purchases" && <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <h2 style={{ margin:0, fontWeight:800, color:"#0f172a", fontSize:20 }}>📦 Purchases Log</h2>
            <button onClick={()=>setModal("purchase")} style={{ background:"#16a34a",color:"#fff",border:"none",borderRadius:9,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer" }}>+ Add Purchase</button>
          </div>
          {purchases.length===0
            ? <div style={{ background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:40,textAlign:"center",color:"#94a3b8",fontSize:14 }}>No purchases yet</div>
            : <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13,background:"#fff",borderRadius:14,overflow:"hidden",border:"1px solid #e2e8f0" }}>
                  <THead cols={["Date","Product","Qty","Unit Cost","Total","Supplier",""]}/>
                  <tbody>
                    {[...purchases].reverse().map((r,i)=>(
                      <tr key={r.id}>
                        <td style={tdSt(i)}><span style={{ fontSize:12,color:"#64748b" }}>{r.date}</span></td>
                        <td style={tdSt(i)}><span style={{ fontWeight:500 }}>{r.product_name}</span></td>
                        <td style={{...tdSt(i),textAlign:"center"}}>{r.qty}</td>
                        <td style={tdSt(i)}>{$(r.cost)}</td>
                        <td style={tdSt(i)}><span style={{ color:"#dc2626",fontWeight:700 }}>{$(r.total)}</span></td>
                        <td style={tdSt(i)}><span style={{ color:"#64748b" }}>{r.notes||"—"}</span></td>
                        <td style={tdSt(i)}><button onClick={()=>setModal({del:{type:"purchases",id:r.id}})} style={{ background:"none",border:"1px solid #fecaca",color:"#dc2626",borderRadius:6,padding:"3px 8px",fontSize:11,cursor:"pointer" }}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr style={{ background:"#0f172a",color:"#fff" }}><td colSpan={4} style={{ padding:"11px 14px",fontWeight:700 }}>Total</td><td style={{ padding:"11px 14px",fontWeight:800,color:"#fde68a" }}>{$(totalCost)}</td><td colSpan={2}/></tr></tfoot>
                </table>
              </div>
          }
        </>}

        {/* ═══ SALES ═══ */}
        {page==="sales" && <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <h2 style={{ margin:0, fontWeight:800, color:"#0f172a", fontSize:20 }}>💰 Sales Log</h2>
            <button onClick={()=>setModal("sale")} style={{ background:"#2563eb",color:"#fff",border:"none",borderRadius:9,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer" }}>+ Record Sale</button>
          </div>
          {sales.length===0
            ? <div style={{ background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:40,textAlign:"center",color:"#94a3b8",fontSize:14 }}>No sales yet</div>
            : <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13,background:"#fff",borderRadius:14,overflow:"hidden",border:"1px solid #e2e8f0" }}>
                  <THead cols={["Date","Product","Qty","Price","Revenue","Client","Source",""]}/>
                  <tbody>
                    {[...sales].reverse().map((r,i)=>(
                      <tr key={r.id}>
                        <td style={tdSt(i)}><span style={{ fontSize:12,color:"#64748b" }}>{r.date}</span></td>
                        <td style={tdSt(i)}><span style={{ fontWeight:500 }}>{r.product_name}</span></td>
                        <td style={{...tdSt(i),textAlign:"center"}}>{r.qty}</td>
                        <td style={tdSt(i)}>{$(r.price)}</td>
                        <td style={tdSt(i)}><span style={{ color:"#16a34a",fontWeight:700 }}>{$(r.total)}</span></td>
                        <td style={tdSt(i)}><span style={{ color:"#64748b" }}>{r.client||"—"}</span></td>
                        <td style={tdSt(i)}>{r.source?<SourceBadge src={r.source}/>:"—"}</td>
                        <td style={tdSt(i)}><button onClick={()=>setModal({del:{type:"sales",id:r.id}})} style={{ background:"none",border:"1px solid #fecaca",color:"#dc2626",borderRadius:6,padding:"3px 8px",fontSize:11,cursor:"pointer" }}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr style={{ background:"#0f172a",color:"#fff" }}><td colSpan={4} style={{ padding:"11px 14px",fontWeight:700 }}>Total</td><td style={{ padding:"11px 14px",fontWeight:800,color:"#86efac" }}>{$(totalRev)}</td><td colSpan={3}/></tr></tfoot>
                </table>
              </div>
          }
        </>}

        {/* ═══ PRODUCTS ═══ */}
        {page==="products" && <>
          <h2 style={{ margin:"0 0 16px", fontWeight:800, color:"#0f172a", fontSize:20 }}>≡ Product Catalog</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
            {PRODUCTS.map((p,i)=>(
              <div key={p.id} style={{ background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"14px 16px" }}>
                <div style={{ width:34,height:34,borderRadius:10,background:PALETTE[i%PALETTE.length]+"22",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10,fontSize:18 }}>🦴</div>
                <div style={{ fontWeight:600,fontSize:13,color:"#0f172a",marginBottom:10,lineHeight:1.5 }}>{p.name}</div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6 }}>
                  {[["Cost",$(p.cost),"#fef2f2","#dc2626","#7f1d1d"],["Sell",$(p.sell),"#f0fdf4","#16a34a","#14532d"],["Profit",$(p.sell-p.cost),"#eff6ff","#2563eb","#1e3a8a"]].map(([lbl,val,bg,lc,vc])=>(
                    <div key={lbl} style={{ background:bg,borderRadius:8,padding:"6px 8px",textAlign:"center" }}>
                      <div style={{ fontSize:10,color:lc,fontWeight:700 }}>{lbl}</div>
                      <div style={{ fontSize:13,fontWeight:800,color:vc }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>}

      </div>

      {/* ═══ MODALS ═══ */}
      {modal==="purchase" && <AddPurchase onSave={addPurchase} onClose={()=>setModal(null)}/>}
      {modal==="sale"     && <AddSale     onSave={addSale}     onClose={()=>setModal(null)} inventory={inventory}/>}
      {modal?.del && (
        <Modal title="Confirm Delete" onClose={()=>setModal(null)}>
          <p style={{ color:"#374151",marginBottom:20 }}>Are you sure? This cannot be undone.</p>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            <Btn label="Cancel" color="#6b7280" onClick={()=>setModal(null)}/>
            <Btn label="Delete" color="#dc2626" onClick={()=>delRecord(modal.del.type,modal.del.id)}/>
          </div>
        </Modal>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type}/>}
    </div>
  );
}
