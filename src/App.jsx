import { useState, useEffect, useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const APP_NAME     = "Kong & Flexi ERP";
const APP_ICON     = "🐾";
const SUPABASE_URL = "https://elyzbvmsinldegiwnjtc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseXpidm1zaW5sZGVnaXduanRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzU5MDgsImV4cCI6MjA4OTY1MTkwOH0.yiTJA7RKOgdfHh9DFbd4E5aLUs_VnCghw4xm1ORs7t4";

const SOURCES = ["Instagram","WhatsApp","In-Person","Website","Other"];
const PALETTE = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#14b8a6","#f97316","#6366f1","#84cc16","#a855f7"];
const $      = (n) => "$" + Number(n||0).toFixed(2);
const f2     = (n) => Number(n||0).toFixed(2);
const tod    = () => new Date().toISOString().split("T")[0];
const toNum  = (v) => parseFloat(String(v).replace(",",".")) || 0;

const CSS = `
*{box-sizing:border-box}body{margin:0}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.slide{animation:up .18s ease}
.nav-links,.nav-btns{display:flex!important}
.burger{display:none!important}
.mob{display:none!important}
.desk{display:block!important}
@media(max-width:640px){
  .nav-links,.nav-btns{display:none!important}
  .burger{display:flex!important}
  .mob{display:block!important}
  .desk{display:none!important}
  .grid2{grid-template-columns:1fr 1fr!important}
  .charts{grid-template-columns:1fr!important}
  .twocol{grid-template-columns:1fr!important}
  .prodgrid{grid-template-columns:1fr!important}
}`;

const H = {apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json"};
const sb = {
  async get(t,o="id.asc"){const r=await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=*&order=${o}`,{headers:H});if(!r.ok)throw new Error(await r.text());return r.json()},
  async insert(t,row){const r=await fetch(`${SUPABASE_URL}/rest/v1/${t}`,{method:"POST",headers:{...H,Prefer:"return=representation"},body:JSON.stringify(row)});if(!r.ok)throw new Error(await r.text());const d=await r.json();return Array.isArray(d)?d[0]:d},
  async update(t,id,row){const r=await fetch(`${SUPABASE_URL}/rest/v1/${t}?id=eq.${id}`,{method:"PATCH",headers:{...H,Prefer:"return=representation"},body:JSON.stringify(row)});if(!r.ok)throw new Error(await r.text());const d=await r.json();return Array.isArray(d)?d[0]:d},
  async del(t,id){const r=await fetch(`${SUPABASE_URL}/rest/v1/${t}?id=eq.${id}`,{method:"DELETE",headers:H});if(!r.ok)throw new Error(await r.text())}
};

const iSt={width:"100%",padding:"10px 12px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:14,outline:"none",background:"#fff",fontFamily:"inherit"};
const sSt={...iSt,cursor:"pointer"};

function Spinner(){return <span style={{display:"inline-block",width:18,height:18,border:"2.5px solid #e2e8f0",borderTop:"2.5px solid #3b82f6",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>}

function Field({label,required,children}){
  return <div style={{marginBottom:14}}>
    <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:5,textTransform:"uppercase",letterSpacing:".04em"}}>
      {label}{required&&<span style={{color:"#ef4444",marginLeft:3}}>*</span>}
    </label>{children}
  </div>
}

function Btn({label,color="#2563eb",onClick,disabled,outline}){
  return <button onClick={onClick} disabled={disabled} style={{
    background:disabled?"#e5e7eb":outline?"transparent":color,
    color:disabled?"#9ca3af":outline?color:"#fff",
    border:outline?`1.5px solid ${color}`:"none",
    borderRadius:10,padding:"11px 20px",fontSize:14,fontWeight:600,
    cursor:disabled?"not-allowed":"pointer",width:"100%",fontFamily:"inherit"
  }}>{label}</button>
}

function Modal({title,onClose,children}){
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center"}}
    onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className="slide" style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:560,maxHeight:"95vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,.2)"}}>
      <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}><div style={{width:36,height:4,borderRadius:4,background:"#e2e8f0"}}/></div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 20px 0"}}>
        <h2 style={{margin:0,fontSize:17,fontWeight:700,color:"#0f172a"}}>{title}</h2>
        <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:50,width:32,height:32,cursor:"pointer",fontSize:16,color:"#64748b"}}>×</button>
      </div>
      <div style={{padding:"14px 20px 32px"}}>{children}</div>
    </div>
  </div>
}

function Toast({msg,type}){
  const c={error:"#ef4444",loading:"#3b82f6",success:"#10b981"}[type]||"#10b981";
  return <div style={{position:"fixed",top:64,left:"50%",transform:"translateX(-50%)",zIndex:3000,
    background:"#0f172a",borderLeft:`4px solid ${c}`,borderRadius:12,padding:"11px 20px",
    fontSize:13,fontWeight:600,color:"#f8fafc",display:"flex",alignItems:"center",gap:8,
    boxShadow:"0 8px 32px rgba(0,0,0,.2)",whiteSpace:"nowrap"}}>
    {type==="loading"&&<Spinner/>}{type==="success"&&<span style={{color:"#10b981"}}>✓</span>}{type==="error"&&<span style={{color:"#ef4444"}}>✗</span>} {msg}
  </div>
}

function KpiCard({label,value,sub,scheme}){
  const s={green:{bg:"#f0fdf4",bd:"#bbf7d0",lbl:"#15803d",val:"#14532d"},red:{bg:"#fef2f2",bd:"#fecaca",lbl:"#dc2626",val:"#7f1d1d"},blue:{bg:"#eff6ff",bd:"#bfdbfe",lbl:"#1d4ed8",val:"#1e3a8a"},purple:{bg:"#f5f3ff",bd:"#ddd6fe",lbl:"#7c3aed",val:"#3b0764"},amber:{bg:"#fffbeb",bd:"#fde68a",lbl:"#d97706",val:"#78350f"}}[scheme]||{bg:"#f8fafc",bd:"#e2e8f0",lbl:"#475569",val:"#0f172a"};
  return <div style={{background:s.bg,border:`1.5px solid ${s.bd}`,borderRadius:14,padding:"14px 16px"}}>
    <div style={{fontSize:10,color:s.lbl,fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:".06em"}}>{label}</div>
    <div style={{fontSize:22,fontWeight:800,color:s.val,lineHeight:1.15}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:s.lbl,marginTop:3}}>{sub}</div>}
  </div>
}

function SrcBadge({src}){
  const m={Instagram:["#eff6ff","#1d4ed8"],WhatsApp:["#f0fdf4","#15803d"],"In-Person":["#fdf4ff","#7e22ce"],Website:["#fff7ed","#c2410c"],Other:["#f9fafb","#4b5563"]};
  const [bg,fg]=m[src]||m.Other;
  return <span style={{background:bg,color:fg,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,whiteSpace:"nowrap"}}>{src}</span>
}

function StockBadge({n}){
  if(n<=0)return <span style={{background:"#fef2f2",color:"#dc2626",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>Out of stock</span>;
  if(n<=3)return <span style={{background:"#fffbeb",color:"#d97706",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>Low stock</span>;
  return <span style={{background:"#f0fdf4",color:"#15803d",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>In stock</span>
}

function MobCards({items,onDelete}){
  return <div style={{display:"flex",flexDirection:"column",gap:10,padding:"8px 0"}}>
    {items.map((item,i)=>(
      <div key={item.id} style={{background:i%2===0?"#f8fafc":"#fff",borderRadius:14,padding:"14px 16px",border:"1px solid #f1f5f9"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div style={{flex:1,paddingRight:10}}>
            <div style={{fontWeight:700,fontSize:13,color:"#0f172a",lineHeight:1.4}}>{item.title}</div>
            {item.sub&&<div style={{fontSize:12,color:"#64748b",marginTop:2}}>{item.sub}</div>}
          </div>
          {item.amount&&<div style={{fontSize:17,fontWeight:800,color:"#16a34a",whiteSpace:"nowrap"}}>{item.amount}</div>}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7,alignItems:"center"}}>
          {item.tags?.filter(Boolean).map((t,ti)=><span key={ti} style={{fontSize:11,background:"#f1f5f9",color:"#475569",padding:"3px 9px",borderRadius:20,fontWeight:500}}>{t}</span>)}
          {item.badge&&<SrcBadge src={item.badge}/>}
          {item.stock!==undefined&&<StockBadge n={item.stock}/>}
        </div>
        {onDelete&&<div style={{marginTop:10,textAlign:"right"}}>
          <button onClick={()=>onDelete(item.id)} style={{background:"none",border:"1px solid #fecaca",color:"#dc2626",borderRadius:8,padding:"4px 12px",fontSize:12,cursor:"pointer"}}>Delete</button>
        </div>}
      </div>
    ))}
  </div>
}

function AddPurchase({onSave,onClose,products}){
  const [f,setF]=useState({date:tod(),name:"",qty:"",cost:"",sell:"",notes:""});
  const [drop,setDrop]=useState(false);
  const [saving,setSaving]=useState(false);
  const set=(k,v)=>setF(x=>({...x,[k]:v}));
  const matched=products.find(p=>p.name.toLowerCase()===f.name.trim().toLowerCase());
  const isNew=f.name.trim().length>0&&!matched;
  const sugg=f.name.trim().length>0?products.filter(p=>p.name.toLowerCase().includes(f.name.trim().toLowerCase())).slice(0,6):[];
  const pick=p=>{setF(x=>({...x,name:p.name,cost:f2(p.cost),sell:f2(p.sell)}));setDrop(false)};
  const total=f.qty&&f.cost?(toNum(f.qty)*toNum(f.cost)).toFixed(2):null;
  const margin=f.cost&&f.sell?(toNum(f.sell)-toNum(f.cost)).toFixed(2):null;
  const valid=f.date&&f.name.trim()&&toNum(f.qty)>0&&toNum(f.cost)>0&&(matched||toNum(f.sell)>0);
  const submit=async()=>{if(!valid)return;setSaving(true);await onSave({date:f.date,name:f.name.trim(),qty:toNum(f.qty),cost:toNum(f.cost),sell:toNum(f.sell)||(matched?.sell||0),total:toNum(total),notes:f.notes,isNew,matchedId:matched?.id||null});setSaving(false);onClose()};
  return <Modal title="📦 Add Purchase" onClose={onClose}>
    <Field label="Date"><input type="date" value={f.date} onChange={e=>set("date",e.target.value)} style={iSt}/></Field>
    <Field label="Product Name" required>
      <div style={{position:"relative"}}>
        <input type="text" placeholder="Type to search or add new..." value={f.name} autoComplete="off"
          onChange={e=>{set("name",e.target.value);setDrop(true);const m=products.find(p=>p.name.toLowerCase()===e.target.value.trim().toLowerCase());if(m)setF(x=>({...x,name:e.target.value,cost:f2(m.cost),sell:f2(m.sell)}))}}
          onFocus={()=>setDrop(true)} onBlur={()=>setTimeout(()=>setDrop(false),150)}
          style={{...iSt,borderColor:matched?"#86efac":isNew&&f.name?"#93c5fd":"#e2e8f0"}}/>
        {drop&&sugg.length>0&&<div style={{position:"absolute",top:"105%",left:0,right:0,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,zIndex:50,boxShadow:"0 8px 32px rgba(0,0,0,.12)",overflow:"hidden"}}>
          {sugg.map(p=><div key={p.id} onMouseDown={()=>pick(p)}
            style={{padding:"11px 14px",cursor:"pointer",fontSize:13,borderBottom:"1px solid #f8fafc",display:"flex",justifyContent:"space-between"}}
            onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
            <span style={{fontWeight:500}}>{p.name}</span>
            <span style={{fontSize:11,color:"#94a3b8"}}>{$(p.cost)} cost</span>
          </div>)}
        </div>}
      </div>
      {matched&&<div style={{marginTop:5,fontSize:12,color:"#15803d",fontWeight:600}}>✓ Existing product — prices loaded</div>}
      {isNew&&f.name&&<div style={{marginTop:5,fontSize:12,color:"#2563eb",fontWeight:600}}>✨ New — will be added to catalog automatically</div>}
    </Field>
    <div className="twocol" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Field label="Unit Cost ($)" required><input type="text" inputMode="decimal" placeholder="e.g. 2,60" value={f.cost} onChange={e=>set("cost",e.target.value)} style={iSt}/></Field>
      <Field label="Selling Price ($)" required={isNew}><input type="text" inputMode="decimal" placeholder="e.g. 6,00" value={f.sell} onChange={e=>set("sell",e.target.value)} style={{...iSt,borderColor:isNew&&!f.sell?"#fca5a5":"#e2e8f0"}}/></Field>
    </div>
    {margin&&<div style={{background:"#eff6ff",borderRadius:10,padding:"9px 14px",marginBottom:14,display:"flex",justifyContent:"space-between"}}>
      <span style={{fontSize:12,color:"#1d4ed8",fontWeight:600}}>Profit / unit</span>
      <span style={{fontSize:16,fontWeight:800,color:"#1e3a8a"}}>${margin}</span>
    </div>}
    <Field label="Quantity" required><input type="number" min="1" placeholder="0" value={f.qty} onChange={e=>set("qty",e.target.value)} style={iSt}/></Field>
    {total&&<div style={{background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{fontSize:13,color:"#15803d",fontWeight:700}}>Total Cost</span>
      <span style={{fontSize:22,fontWeight:800,color:"#14532d"}}>${total}</span>
    </div>}
    <Field label="Supplier / Notes"><input type="text" placeholder="Supplier or note..." value={f.notes} onChange={e=>set("notes",e.target.value)} style={iSt}/></Field>
    <Btn label={saving?"Saving...":"✓ Save Purchase"} color={valid?"#16a34a":"#9ca3af"} onClick={submit} disabled={!valid||saving}/>
  </Modal>
}

function AddSale({onSave,onClose,products,inventory}){
  const [f,setF]=useState({date:tod(),pid:"",qty:"",price:"",client:"",source:"",notes:""});
  const [saving,setSaving]=useState(false);
  const set=(k,v)=>setF(x=>({...x,[k]:v}));
  const prod=products.find(p=>p.id===Number(f.pid));
  const stock=inventory[Number(f.pid)]||0;
  const pick=id=>{const p=products.find(x=>x.id===Number(id));setF(x=>({...x,pid:id,price:p?f2(p.sell):""}))};
  const total=f.qty&&f.price?(toNum(f.qty)*toNum(f.price)).toFixed(2):null;
  const over=toNum(f.qty)>stock&&f.pid;
  const valid=f.date&&f.pid&&toNum(f.qty)>0&&toNum(f.price)>0&&!over;
  const submit=async()=>{if(!valid)return;setSaving(true);await onSave({date:f.date,product_id:Number(f.pid),product_name:prod.name,qty:toNum(f.qty),price:toNum(f.price),total:toNum(total),client:f.client,source:f.source,notes:f.notes});setSaving(false);onClose()};
  return <Modal title="💰 Record Sale" onClose={onClose}>
    <Field label="Date"><input type="date" value={f.date} onChange={e=>set("date",e.target.value)} style={iSt}/></Field>
    <Field label="Product" required>
      <select value={f.pid} onChange={e=>pick(e.target.value)} style={sSt}>
        <option value="">— Select product —</option>
        {products.map(p=><option key={p.id} value={p.id}>{p.name} ({inventory[p.id]||0} left)</option>)}
      </select>
    </Field>
    {f.pid&&<div style={{background:"#eff6ff",borderRadius:8,padding:"7px 12px",marginBottom:12,fontSize:12,color:"#1d4ed8",fontWeight:600}}>Stock available: {stock} units</div>}
    <div className="twocol" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Field label="Quantity" required><input type="number" min="1" placeholder="0" value={f.qty} onChange={e=>set("qty",e.target.value)} style={{...iSt,borderColor:over?"#ef4444":"#e2e8f0"}}/></Field>
      <Field label="Selling Price ($)" required><input type="text" inputMode="decimal" placeholder="0.00" value={f.price} onChange={e=>set("price",e.target.value)} style={iSt}/></Field>
    </div>
    {over&&<div style={{color:"#dc2626",fontSize:12,marginBottom:10,fontWeight:600}}>⚠️ Only {stock} units available</div>}
    {total&&!over&&<div style={{background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{fontSize:13,color:"#d97706",fontWeight:700}}>Total Revenue</span>
      <span style={{fontSize:22,fontWeight:800,color:"#78350f"}}>${total}</span>
    </div>}
    <div className="twocol" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Field label="Client Name"><input type="text" placeholder="Client..." value={f.client} onChange={e=>set("client",e.target.value)} style={iSt}/></Field>
      <Field label="Source"><select value={f.source} onChange={e=>set("source",e.target.value)} style={sSt}><option value="">— Select —</option>{SOURCES.map(s=><option key={s} value={s}>{s}</option>)}</select></Field>
    </div>
    <Field label="Notes"><input type="text" placeholder="Any note..." value={f.notes} onChange={e=>set("notes",e.target.value)} style={iSt}/></Field>
    <Btn label={saving?"Saving...":"✓ Save Sale"} color={valid?"#2563eb":"#9ca3af"} onClick={submit} disabled={!valid||saving}/>
  </Modal>
}

function ProdForm({initial,onSave,saving}){
  const [f,setF]=useState(initial||{name:"",cost:"",sell:""});
  const set=(k,v)=>setF(x=>({...x,[k]:v}));
  const margin=f.cost&&f.sell?(toNum(f.sell)-toNum(f.cost)).toFixed(2):null;
  const valid=f.name.trim()&&toNum(f.cost)>0&&toNum(f.sell)>0;
  return <>
    <Field label="Product Name" required><input type="text" placeholder="Product name..." value={f.name} onChange={e=>set("name",e.target.value)} style={iSt}/></Field>
    <div className="twocol" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Field label="Cost ($)" required><input type="text" inputMode="decimal" placeholder="12,40" value={f.cost} onChange={e=>set("cost",e.target.value)} style={iSt}/></Field>
      <Field label="Sell Price ($)" required><input type="text" inputMode="decimal" placeholder="25,00" value={f.sell} onChange={e=>set("sell",e.target.value)} style={iSt}/></Field>
    </div>
    {margin&&<div style={{background:"#eff6ff",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",justifyContent:"space-between"}}>
      <span style={{fontSize:13,color:"#1d4ed8",fontWeight:600}}>Profit / unit</span>
      <span style={{fontSize:18,fontWeight:800,color:"#1e3a8a"}}>${margin}</span>
    </div>}
    <Btn label={saving?"Saving...":"✓ Save Product"} color={valid?"#2563eb":"#9ca3af"} onClick={()=>valid&&onSave(f)} disabled={!valid||saving}/>
  </>
}

export default function App(){
  const [products,setProducts]=useState([]);
  const [purchases,setPurchases]=useState([]);
  const [sales,setSales]=useState([]);
  const [loading,setLoading]=useState(true);
  const [toast,setToast]=useState(null);
  const [page,setPage]=useState("dashboard");
  const [modal,setModal]=useState(null);
  const [menu,setMenu]=useState(false);

  const notify=(msg,type="success",ms=2500)=>{setToast({msg,type});if(type!=="loading")setTimeout(()=>setToast(null),ms)};
  const loadAll=useCallback(async()=>{try{setLoading(true);const[pr,pu,sa]=await Promise.all([sb.get("products","name.asc"),sb.get("purchases"),sb.get("sales")]);setProducts(pr);setPurchases(pu);setSales(sa)}catch{notify("Connection error — check Supabase credentials","error",6000)}finally{setLoading(false)}},[]);
  useEffect(()=>{loadAll()},[]);

  const go=id=>{setPage(id);setMenu(false)};

  const addPurchase=async row=>{
    notify("Saving...","loading");
    try{
      let pid=row.matchedId,pname=row.name;
      if(row.isNew){
        const ex=products.find(p=>p.name.toLowerCase()===row.name.toLowerCase());
        if(ex){pid=ex.id;pname=ex.name}
        else{const np=await sb.insert("products",{name:row.name,cost:row.cost,sell:row.sell});setProducts(p=>[...p,np].sort((a,b)=>a.name.localeCompare(b.name)));pid=np.id;pname=np.name}
      }
      const s=await sb.insert("purchases",{date:row.date,product_id:pid,product_name:pname,qty:row.qty,cost:row.cost,total:row.total,notes:row.notes});
      setPurchases(p=>[...p,s]);notify("Purchase saved ✓")
    }catch(e){notify("Failed: "+e.message,"error")}
  };

  const addSale=async row=>{notify("Saving...","loading");try{const s=await sb.insert("sales",{...row});setSales(p=>[...p,s]);notify("Sale saved ✓")}catch(e){notify("Failed: "+e.message,"error")}};
  const addProd=async f=>{notify("Saving...","loading");try{const s=await sb.insert("products",{name:f.name.trim(),cost:toNum(f.cost),sell:toNum(f.sell)});setProducts(p=>[...p,s].sort((a,b)=>a.name.localeCompare(b.name)));notify("Product added ✓");setModal(null)}catch(e){notify("Failed: "+e.message,"error")}};
  const editProd=async(id,f)=>{notify("Saving...","loading");try{const s=await sb.update("products",id,{name:f.name.trim(),cost:toNum(f.cost),sell:toNum(f.sell)});setProducts(p=>p.map(x=>x.id===id?s:x));notify("Updated ✓");setModal(null)}catch(e){notify("Failed: "+e.message,"error")}};
  const delRec=async(table,id)=>{notify("Deleting...","loading");try{await sb.del(table,id);if(table==="products")setProducts(p=>p.filter(x=>x.id!==id));if(table==="purchases")setPurchases(p=>p.filter(x=>x.id!==id));if(table==="sales")setSales(p=>p.filter(x=>x.id!==id));notify("Deleted ✓");setModal(null)}catch(e){notify("Failed: "+e.message,"error")}};

  const inv=useMemo(()=>{const i={};products.forEach(p=>{i[p.id]=0});purchases.forEach(r=>{i[r.product_id]=(i[r.product_id]||0)+(r.qty||0)});sales.forEach(r=>{i[r.product_id]=(i[r.product_id]||0)-(r.qty||0)});return i},[products,purchases,sales]);
  const totalRev=sales.reduce((s,r)=>s+(r.total||0),0);
  const totalCost=purchases.reduce((s,r)=>s+(r.total||0),0);
  const profit=totalRev-totalCost;
  const margin=totalRev>0?profit/totalRev*100:0;
  const unitsSold=sales.reduce((s,r)=>s+(r.qty||0),0);
  const pStats=useMemo(()=>products.map(p=>{const purQ=purchases.filter(r=>r.product_id===p.id).reduce((s,r)=>s+(r.qty||0),0);const salQ=sales.filter(r=>r.product_id===p.id).reduce((s,r)=>s+(r.qty||0),0);const rev=sales.filter(r=>r.product_id===p.id).reduce((s,r)=>s+(r.total||0),0);return{...p,purQ,salQ,rev,profit:rev-salQ*(p.cost||0),stock:inv[p.id]||0}}),[products,purchases,sales,inv]);
  const srcPie=useMemo(()=>SOURCES.map(s=>({name:s,orders:sales.filter(r=>r.source===s).length,revenue:sales.filter(r=>r.source===s).reduce((t,r)=>t+(r.total||0),0)})).filter(s=>s.orders>0),[sales]);
  const topP=[...pStats].sort((a,b)=>b.rev-a.rev).filter(p=>p.rev>0).slice(0,6);
  const lowS=pStats.filter(p=>p.stock<=3);

  const NAV=[{id:"dashboard",icon:"◈",label:"Dashboard"},{id:"products",icon:"🦴",label:"Products"},{id:"inventory",icon:"▦",label:"Inventory"},{id:"purchases",icon:"↓",label:"Purchases"},{id:"sales",icon:"↑",label:"Sales"}];
  const hdr=(t,btn)=><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h2 style={{margin:0,fontWeight:800,color:"#0f172a",fontSize:19}}>{t}</h2>{btn}</div>;
  const abtn=(l,c,fn)=><button onClick={fn} style={{background:c,color:"#fff",border:"none",borderRadius:10,padding:"9px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>{l}</button>;
  const empty=(icon,msg,action)=><div style={{background:"#fff",borderRadius:16,border:"1px solid #e2e8f0",padding:"48px 20px",textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>{icon}</div><div style={{color:"#94a3b8",fontSize:14,marginBottom:action?16:0}}>{msg}</div>{action}</div>;
  const thSt={padding:"12px 14px",textAlign:"left",fontWeight:600,fontSize:12,whiteSpace:"nowrap"};
  const tdRow=(i)=>({background:i%2===0?"#f8fafc":"#fff",borderBottom:"1px solid #f1f5f9"});
  const td={padding:"10px 14px"};

  if(loading)return<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",gap:14,fontFamily:"sans-serif"}}><Spinner/><p style={{color:"#64748b",fontSize:14}}>Loading...</p></div>;

  return <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",minHeight:"100vh",background:"#f1f5f9"}}>
    <style>{CSS}</style>

    {/* NAV */}
    <div style={{background:"#0f172a",position:"sticky",top:0,zIndex:200,boxShadow:"0 2px 16px rgba(0,0,0,.3)"}}>
      <div style={{display:"flex",alignItems:"center",padding:"0 16px",height:54}}>
        <div style={{fontWeight:800,fontSize:15,color:"#f8fafc",flex:1}}>{APP_ICON} {APP_NAME}</div>
        <div className="nav-links" style={{alignItems:"center"}}>
          {NAV.map(n=><button key={n.id} onClick={()=>go(n.id)} style={{background:"none",border:"none",color:page===n.id?"#fff":"#94a3b8",fontWeight:page===n.id?700:400,fontSize:13,padding:"17px 11px",cursor:"pointer",borderBottom:page===n.id?"3px solid #3b82f6":"3px solid transparent",whiteSpace:"nowrap",fontFamily:"inherit"}}>{n.icon} {n.label}</button>)}
        </div>
        <div className="nav-btns" style={{gap:8,marginLeft:12}}>
          <button onClick={()=>setModal("purchase")} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Purchase</button>
          <button onClick={()=>setModal("sale")}     style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Sale</button>
        </div>
        <button className="burger" onClick={()=>setMenu(o=>!o)} style={{background:"none",border:"none",cursor:"pointer",padding:8,flexDirection:"column",gap:5,marginLeft:"auto"}}>
          <span style={{display:"block",width:22,height:2,background:menu?"#ef4444":"#fff",borderRadius:2,transition:"all .2s",transform:menu?"rotate(45deg) translate(5px,5px)":"none"}}/>
          <span style={{display:"block",width:22,height:2,background:"#fff",borderRadius:2,opacity:menu?0:1,transition:"all .2s"}}/>
          <span style={{display:"block",width:22,height:2,background:menu?"#ef4444":"#fff",borderRadius:2,transition:"all .2s",transform:menu?"rotate(-45deg) translate(5px,-5px)":"none"}}/>
        </button>
      </div>
      {menu&&<div className="slide" style={{background:"#1e293b",borderTop:"1px solid #334155",paddingBottom:12}}>
        {NAV.map(n=><button key={n.id} onClick={()=>go(n.id)} style={{display:"flex",alignItems:"center",gap:12,width:"100%",background:page===n.id?"rgba(59,130,246,.15)":"none",border:"none",borderLeft:page===n.id?"3px solid #3b82f6":"3px solid transparent",color:page===n.id?"#fff":"#94a3b8",fontWeight:page===n.id?700:500,fontSize:15,padding:"13px 20px",cursor:"pointer",fontFamily:"inherit"}}><span style={{fontSize:18}}>{n.icon}</span>{n.label}</button>)}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,padding:"10px 16px 0"}}>
          <button onClick={()=>{setModal("purchase");setMenu(false)}} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:10,padding:12,fontSize:14,fontWeight:700,cursor:"pointer"}}>+ Purchase</button>
          <button onClick={()=>{setModal("sale");setMenu(false)}} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:10,padding:12,fontSize:14,fontWeight:700,cursor:"pointer"}}>+ Sale</button>
        </div>
      </div>}
    </div>

    <div style={{padding:"18px 16px 48px",maxWidth:1100,margin:"0 auto"}}>

      {/* DASHBOARD */}
      {page==="dashboard"&&<>
        {hdr("Dashboard")}
        <div className="grid2" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:16}}>
          <KpiCard label="Revenue"  value={$(totalRev)}           scheme="green"/>
          <KpiCard label="Cost"     value={$(totalCost)}          scheme="red"/>
          <KpiCard label="Profit"   value={$(profit)}             scheme="blue" sub={profit>=0?"▲":"▼ Loss"}/>
          <KpiCard label="Margin"   value={margin.toFixed(1)+"%"} scheme="purple"/>
          <KpiCard label="Orders"   value={sales.length}          scheme="amber" sub={unitsSold+" units"}/>
        </div>
        {lowS.length>0&&<div style={{background:"#fff7ed",border:"1.5px solid #fed7aa",borderRadius:14,padding:"12px 16px",marginBottom:16}}>
          <div style={{fontWeight:700,color:"#c2410c",fontSize:13,marginBottom:8}}>⚠️ Reorder Alert</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {lowS.map(p=><span key={p.id} style={{background:p.stock<=0?"#fef2f2":"#fffbeb",color:p.stock<=0?"#dc2626":"#d97706",fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:20}}>{p.name} — {p.stock} left</span>)}
          </div>
        </div>}

        <div className="charts" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
          <div style={{background:"#fff",borderRadius:16,border:"1px solid #e2e8f0",padding:"16px 14px 12px"}}>
            <div style={{fontWeight:700,color:"#0f172a",marginBottom:12,fontSize:14}}>🏆 Top Products</div>
            {topP.length===0?<div style={{color:"#94a3b8",fontSize:13,padding:"24px 0",textAlign:"center"}}>No sales yet</div>
            :<ResponsiveContainer width="100%" height={220}>
              <BarChart data={topP} layout="vertical" margin={{left:0,right:28,top:2,bottom:2}}>
                <XAxis type="number" tick={{fontSize:10}} tickFormatter={v=>"$"+v} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="name" width={120} tick={{fontSize:9}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{borderRadius:10,border:"none",boxShadow:"0 4px 20px rgba(0,0,0,.1)",fontSize:12}} formatter={v=>["$"+v.toFixed(2),"Revenue"]}/>
                <Bar dataKey="rev" radius={[0,6,6,0]}>{topP.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>}
          </div>
          <div style={{background:"#fff",borderRadius:16,border:"1px solid #e2e8f0",padding:"16px 14px 12px"}}>
            <div style={{fontWeight:700,color:"#0f172a",marginBottom:12,fontSize:14}}>📲 By Channel</div>
            {srcPie.length===0?<div style={{color:"#94a3b8",fontSize:13,padding:"24px 0",textAlign:"center"}}>No sales yet</div>
            :<>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={srcPie} dataKey="revenue" cx="50%" cy="50%" innerRadius={42} outerRadius={70} paddingAngle={3}>
                    {srcPie.map((_,i)=><Cell key={i} fill={PALETTE[i]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius:10,border:"none",fontSize:12}} formatter={v=>["$"+v.toFixed(2),"Revenue"]}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{display:"flex",flexDirection:"column",gap:5,marginTop:6}}>
                {srcPie.map((s,i)=><div key={s.name} style={{display:"flex",justifyContent:"space-between",padding:"5px 8px",background:"#f8fafc",borderRadius:8}}>
                  <span style={{fontSize:12,color:"#475569",display:"flex",alignItems:"center",gap:6}}><span style={{width:10,height:10,borderRadius:3,background:PALETTE[i],display:"inline-block"}}/>{s.name}</span>
                  <span style={{fontSize:12,fontWeight:700,color:"#0f172a"}}>{$(s.revenue)}</span>
                </div>)}
              </div>
            </>}
          </div>
        </div>

        <div style={{background:"#fff",borderRadius:16,border:"1px solid #e2e8f0",overflow:"hidden"}}>
          <div style={{padding:"14px 16px 12px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontWeight:700,color:"#0f172a",fontSize:14}}>🕐 Recent Sales</div>
            {sales.length>0&&<span style={{fontSize:12,color:"#94a3b8"}}>{sales.length} total</span>}
          </div>
          {sales.length===0?<div style={{color:"#94a3b8",fontSize:13,textAlign:"center",padding:"28px 0"}}>No sales yet — tap "+ Sale"</div>:<>
            <div className="mob" style={{padding:"10px 12px"}}>
              <MobCards items={[...sales].reverse().slice(0,6).map((r,i)=>({id:r.id,title:r.product_name,sub:r.date,amount:$(r.total),tags:[`×${r.qty}`,r.client?`👤 ${r.client}`:null].filter(Boolean),badge:r.source||null}))}/>
            </div>
            <div className="desk" style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{background:"#0f172a",color:"#fff"}}>{["Date","Product","Qty","Revenue","Client","Source"].map(h=><th key={h} style={thSt}>{h}</th>)}</tr></thead>
                <tbody>{[...sales].reverse().slice(0,8).map((r,i)=><tr key={r.id} style={tdRow(i)}>
                  <td style={{...td,fontSize:12,color:"#64748b"}}>{r.date}</td>
                  <td style={{...td,fontWeight:500}}>{r.product_name}</td>
                  <td style={{...td,textAlign:"center"}}>{r.qty}</td>
                  <td style={{...td,color:"#16a34a",fontWeight:700}}>{$(r.total)}</td>
                  <td style={{...td,color:"#64748b"}}>{r.client||"—"}</td>
                  <td style={td}>{r.source?<SrcBadge src={r.source}/>:"—"}</td>
                </tr>)}</tbody>
              </table>
            </div>
          </>}
        </div>
      </>}

      {/* PRODUCTS */}
      {page==="products"&&<>
        {hdr("🦴 Products",abtn("+ Add Product","#2563eb",()=>setModal("addProduct")))}
        {products.length===0?empty("🦴","No products yet",<button onClick={()=>setModal("addProduct")} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:10,padding:"10px 24px",fontSize:14,fontWeight:700,cursor:"pointer"}}>+ Add First Product</button>)
        :<div className="prodgrid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
          {products.map((p,i)=><div key={p.id} style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:36,height:36,borderRadius:10,background:PALETTE[i%PALETTE.length]+"22",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>🦴</div>
              <div style={{fontWeight:600,fontSize:13,color:"#0f172a",lineHeight:1.4}}>{p.name}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
              {[["Cost",$(p.cost),"#fef2f2","#dc2626","#7f1d1d"],["Sell",$(p.sell),"#f0fdf4","#16a34a","#14532d"],["Profit",$(p.sell-p.cost),"#eff6ff","#2563eb","#1e3a8a"]].map(([l,v,bg,lc,vc])=>(
                <div key={l} style={{background:bg,borderRadius:8,padding:"6px 8px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:lc,fontWeight:700}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:800,color:vc}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <button onClick={()=>setModal({editProd:p})} style={{background:"#f5f3ff",color:"#6d28d9",border:"none",borderRadius:8,padding:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>✏️ Edit</button>
              <button onClick={()=>setModal({del:{table:"products",id:p.id}})} style={{background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:8,padding:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>🗑️ Delete</button>
            </div>
          </div>)}
        </div>}
      </>}

      {/* INVENTORY */}
      {page==="inventory"&&<>
        {hdr("📦 Inventory")}
        <div className="mob"><MobCards items={pStats.map(p=>({id:p.id,title:p.name,sub:`Cost ${$(p.cost)} · Sell ${$(p.sell)} · Profit ${$(p.sell-p.cost)}`,amount:String(p.stock)+" units",tags:[`Purchased: ${p.purQ}`,`Sold: ${p.salQ}`],stock:p.stock}))}/></div>
        <div className="desk" style={{background:"#fff",borderRadius:16,border:"1px solid #e2e8f0",overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"#0f172a",color:"#fff"}}>{["Product","Cost","Sell","Margin","Purchased","Sold","Stock","Status"].map(h=><th key={h} style={thSt}>{h}</th>)}</tr></thead>
            <tbody>{pStats.map((p,i)=><tr key={p.id} style={tdRow(i)}>
              <td style={{...td,fontWeight:500}}>{p.name}</td>
              <td style={{...td,color:"#dc2626"}}>{$(p.cost)}</td>
              <td style={{...td,color:"#16a34a"}}>{$(p.sell)}</td>
              <td style={{...td,color:"#2563eb",fontWeight:700}}>{$(p.sell-p.cost)}</td>
              <td style={{...td,textAlign:"center"}}>{p.purQ}</td>
              <td style={{...td,textAlign:"center"}}>{p.salQ}</td>
              <td style={{...td,textAlign:"center",fontWeight:800,fontSize:15,color:p.stock<=0?"#dc2626":p.stock<=3?"#d97706":"#15803d"}}>{p.stock}</td>
              <td style={td}><StockBadge n={p.stock}/></td>
            </tr>)}</tbody>
          </table>
        </div>
      </>}

      {/* PURCHASES */}
      {page==="purchases"&&<>
        {hdr("📦 Purchases",abtn("+ Add Purchase","#16a34a",()=>setModal("purchase")))}
        {purchases.length===0?empty("📦","No purchases yet"):<>
          <div style={{background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:13,color:"#15803d",fontWeight:700}}>Total Cost</span>
            <span style={{fontSize:18,fontWeight:800,color:"#14532d"}}>{$(purchases.reduce((s,r)=>s+(r.total||0),0))}</span>
          </div>
          <div className="mob"><MobCards items={[...purchases].reverse().map(r=>({id:r.id,title:r.product_name,sub:r.date,amount:$(r.total),tags:[`Qty: ${r.qty}`,`Unit: ${$(r.cost)}`,r.notes].filter(Boolean)}))} onDelete={id=>setModal({del:{table:"purchases",id}})}/></div>
          <div className="desk" style={{background:"#fff",borderRadius:16,border:"1px solid #e2e8f0",overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:"#0f172a",color:"#fff"}}>{["Date","Product","Qty","Unit Cost","Total","Notes",""].map(h=><th key={h} style={thSt}>{h}</th>)}</tr></thead>
              <tbody>{[...purchases].reverse().map((r,i)=><tr key={r.id} style={tdRow(i)}>
                <td style={{...td,color:"#64748b",fontSize:12}}>{r.date}</td>
                <td style={{...td,fontWeight:500}}>{r.product_name}</td>
                <td style={{...td,textAlign:"center"}}>{r.qty}</td>
                <td style={td}>{$(r.cost)}</td>
                <td style={{...td,color:"#dc2626",fontWeight:700}}>{$(r.total)}</td>
                <td style={{...td,color:"#64748b"}}>{r.notes||"—"}</td>
                <td style={td}><button onClick={()=>setModal({del:{table:"purchases",id:r.id}})} style={{background:"#fef2f2",border:"none",color:"#dc2626",borderRadius:7,padding:"4px 10px",fontSize:11,cursor:"pointer"}}>Delete</button></td>
              </tr>)}</tbody>
            </table>
          </div>
        </>}
      </>}

      {/* SALES */}
      {page==="sales"&&<>
        {hdr("💰 Sales",abtn("+ Record Sale","#2563eb",()=>setModal("sale")))}
        {sales.length===0?empty("💰","No sales yet"):<>
          <div style={{background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:13,color:"#15803d",fontWeight:700}}>Total Revenue</span>
            <span style={{fontSize:18,fontWeight:800,color:"#14532d"}}>{$(totalRev)}</span>
          </div>
          <div className="mob"><MobCards items={[...sales].reverse().map(r=>({id:r.id,title:r.product_name,sub:r.date,amount:$(r.total),tags:[`×${r.qty}`,`${$(r.price)}/unit`,r.client?`👤 ${r.client}`:null].filter(Boolean),badge:r.source||null}))} onDelete={id=>setModal({del:{table:"sales",id}})}/></div>
          <div className="desk" style={{background:"#fff",borderRadius:16,border:"1px solid #e2e8f0",overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:"#0f172a",color:"#fff"}}>{["Date","Product","Qty","Price","Revenue","Client","Source",""].map(h=><th key={h} style={thSt}>{h}</th>)}</tr></thead>
              <tbody>{[...sales].reverse().map((r,i)=><tr key={r.id} style={tdRow(i)}>
                <td style={{...td,color:"#64748b",fontSize:12}}>{r.date}</td>
                <td style={{...td,fontWeight:500}}>{r.product_name}</td>
                <td style={{...td,textAlign:"center"}}>{r.qty}</td>
                <td style={td}>{$(r.price)}</td>
                <td style={{...td,color:"#16a34a",fontWeight:700}}>{$(r.total)}</td>
                <td style={{...td,color:"#64748b"}}>{r.client||"—"}</td>
                <td style={td}>{r.source?<SrcBadge src={r.source}/>:"—"}</td>
                <td style={td}><button onClick={()=>setModal({del:{table:"sales",id:r.id}})} style={{background:"#fef2f2",border:"none",color:"#dc2626",borderRadius:7,padding:"4px 10px",fontSize:11,cursor:"pointer"}}>Delete</button></td>
              </tr>)}</tbody>
            </table>
          </div>
        </>}
      </>}

    </div>

    {/* MODALS */}
    {modal==="purchase"  &&<AddPurchase onSave={addPurchase} onClose={()=>setModal(null)} products={products}/>}
    {modal==="sale"      &&<AddSale     onSave={addSale}     onClose={()=>setModal(null)} products={products} inventory={inv}/>}
    {modal==="addProduct"&&<Modal title="➕ Add Product"  onClose={()=>setModal(null)}><ProdForm onSave={addProd}/></Modal>}
    {modal?.editProd     &&<Modal title="✏️ Edit Product" onClose={()=>setModal(null)}><ProdForm initial={modal.editProd} onSave={f=>editProd(modal.editProd.id,f)}/></Modal>}
    {modal?.del&&<Modal title="Confirm Delete" onClose={()=>setModal(null)}>
      <p style={{color:"#374151",marginBottom:20,fontSize:14}}>Are you sure? This cannot be undone.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Btn label="Cancel" color="#6b7280" outline onClick={()=>setModal(null)}/>
        <Btn label="Delete" color="#dc2626" onClick={()=>delRec(modal.del.table,modal.del.id)}/>
      </div>
    </Modal>}

    {toast&&<Toast msg={toast.msg} type={toast.type}/>}
  </div>
}
