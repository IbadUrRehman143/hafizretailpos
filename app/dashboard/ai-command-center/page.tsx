"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ActionRow = {
  id:string; title:string; reason:string; status:string; workflow:string;
  payload:Record<string,unknown>; createdAt:string;
};
type KnowledgeRow = {
  id?:string; sourceId?:string; title:string; sourceType:string;
  excerpt?:string; score?:number; characters?:number; chunks?:number;
};

export default function AutonomousIntelligenceCenter() {
  const [actions,setActions]=useState<ActionRow[]>([]);
  const [knowledge,setKnowledge]=useState<KnowledgeRow[]>([]);
  const [query,setQuery]=useState("");
  const [title,setTitle]=useState("");
  const [content,setContent]=useState("");
  const [sourceType,setSourceType]=useState("NOTE");
  const [supplierId,setSupplierId]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  const loadActions=useCallback(async()=>{
    const r=await fetch("/api/ai/approvals",{cache:"no-store"});
    const j=await r.json(); setActions(j.data||[]);
  },[]);
  const loadKnowledge=useCallback(async(q="")=>{
    const r=await fetch(`/api/ai/knowledge${q?`?q=${encodeURIComponent(q)}`:""}`,{cache:"no-store"});
    const j=await r.json(); setKnowledge(j.data||[]);
  },[]);

  useEffect(()=>{void loadActions();void loadKnowledge();},[loadActions,loadKnowledge]);

  async function addSource(){
    if(!title.trim()||!content.trim()){setMessage("Title and content are required.");return;}
    setBusy(true);setMessage("");
    const r=await fetch("/api/ai/knowledge",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({title,content,sourceType})});
    const j=await r.json(); setMessage(j.success?"Knowledge source added.":j.message||"Unable to add source.");
    if(j.success){setTitle("");setContent("");await loadKnowledge();}
    setBusy(false);
  }
  async function buildPlan(){
    setBusy(true);setMessage("");
    const r=await fetch("/api/ai/agent",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({workflow:"PURCHASE_PLAN",targetStockDays:30,supplierId:Number(supplierId||0)})});
    const j=await r.json();setMessage(j.success?"Verified purchase plan sent to Approval Center.":j.message||"Unable to build plan.");
    if(j.success)await loadActions();setBusy(false);
  }
  async function decide(id:string,action:string){
    setBusy(true);setMessage("");
    const r=await fetch("/api/ai/approvals",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({id,action})});
    const j=await r.json();setMessage(j.success?`Action ${action.toLowerCase()} completed.`:j.message||"Unable to update action.");
    await loadActions();setBusy(false);
  }

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6">
      <Link href="/dashboard" className="text-sm font-semibold text-blue-600">← Back to Dashboard</Link>
      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">HECC AI Copilot</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Autonomous Intelligence Center</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          AI Knowledge Hub • Autonomous Business Agent • AI Approval Center
        </p>
      </div>

      {message && <div className="mt-5 rounded-xl border bg-white px-4 py-3 text-sm text-slate-700">{message}</div>}

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">AI Knowledge Hub</h2>
          <p className="mt-1 text-sm text-slate-500">Add policies, supplier terms, product knowledge and business notes.</p>
          <div className="mt-4 grid gap-3">
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Knowledge title *" className="rounded-xl border px-3 py-2.5 text-sm"/>
            <select value={sourceType} onChange={e=>setSourceType(e.target.value)} className="rounded-xl border px-3 py-2.5 text-sm">
              <option value="NOTE">Business Note</option><option value="POLICY">Policy</option>
              <option value="SUPPLIER">Supplier Terms</option><option value="PRODUCT">Product Knowledge</option>
            </select>
            <textarea value={content} onChange={e=>setContent(e.target.value)} rows={5} placeholder="Verified source content *" className="rounded-xl border px-3 py-2.5 text-sm"/>
            <button disabled={busy} onClick={addSource} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Add to Knowledge Hub</button>
          </div>
          <div className="mt-5 flex gap-2">
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search knowledge…" className="min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-sm"/>
            <button onClick={()=>loadKnowledge(query)} className="rounded-xl border px-4 py-2.5 text-sm font-semibold">Search</button>
          </div>
          <div className="mt-4 space-y-2">
            {knowledge.length===0?<p className="text-sm text-slate-500">No matching knowledge yet.</p>:knowledge.slice(0,6).map((k,i)=>
              <div key={`${k.id||k.sourceId}-${i}`} className="rounded-xl bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3"><strong className="text-sm text-slate-900">{k.title}</strong><span className="text-[11px] font-bold text-slate-500">{k.sourceType}</span></div>
                {k.excerpt&&<p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600">{k.excerpt}</p>}
                {typeof k.score==="number"&&<p className="mt-1 text-[11px] text-slate-400">Retrieval score: {Math.round(k.score*100)}%</p>}
              </div>)}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Autonomous Business Agent</h2>
          <p className="mt-1 text-sm text-slate-500">Builds a purchase plan from verified Inventory AI Intelligence. No guessed stock numbers.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input value={supplierId} onChange={e=>setSupplierId(e.target.value)} inputMode="numeric" placeholder="Supplier ID *" className="rounded-xl border px-3 py-2.5 text-sm"/>
            <button disabled={busy} onClick={buildPlan} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Build 30-Day Purchase Plan</button>
          </div>
          <div className="mt-5 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            The agent creates a persistent purchase draft from verified inventory data. It cannot change stock before human approval. After approval, Execute creates the purchase, purchase items and inventory transactions in one controlled database transaction.
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-lg font-bold text-slate-900">AI Approval Center</h2><p className="mt-1 text-sm text-slate-500">Review, approve, reject and execute controlled AI actions.</p></div>
          <button onClick={loadActions} className="rounded-xl border px-4 py-2 text-sm font-semibold">Refresh</button>
        </div>
        <div className="mt-4 grid gap-3">
          {actions.length===0?<div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No AI actions awaiting review.</div>:actions.map(a=>
            <div key={a.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="font-bold text-slate-900">{a.title}</h3><p className="mt-1 text-sm text-slate-500">{a.reason}</p></div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{a.status}</span>
              </div>
              {a.status==="PENDING"&&<div className="mt-4 flex gap-2"><button disabled={busy} onClick={()=>decide(a.id,"APPROVE")} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Approve</button><button disabled={busy} onClick={()=>decide(a.id,"REJECT")} className="rounded-lg border px-4 py-2 text-sm font-semibold">Reject</button></div>}
              {a.status==="APPROVED"&&<button disabled={busy} onClick={()=>decide(a.id,"EXECUTE")} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Execute Approved Action</button>}
            </div>)}
        </div>
      </section>
    </main>
  );
}
