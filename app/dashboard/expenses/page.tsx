"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import ExpenseModal from "./ExpenseModal";
import ExpenseStats from "./ExpenseStats";
import ExpenseViewModal from "./ExpenseViewModal";
import { expenseCategories, type Expense, type ExpenseInput } from "./expenseTypes";
import { expenseStats, formatPrice } from "./expenseUtils";

export default function ExpensesPage() {
  const [expenses,setExpenses]=useState<Expense[]>([]);
  const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false);
  const [search,setSearch]=useState(""); const [categoryFilter,setCategoryFilter]=useState("All");
  const [showModal,setShowModal]=useState(false); const [editing,setEditing]=useState<Expense|null>(null); const [selected,setSelected]=useState<Expense|null>(null);

  const load=useCallback(async()=>{try{setLoading(true);const r=await fetch("/api/expenses",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Failed to load expenses.");setExpenses(d.expenses||[])}catch(e){alert(e instanceof Error?e.message:"Failed to load expenses.")}finally{setLoading(false)}},[]);
  useEffect(()=>{void load()},[load]);

  const filtered=useMemo(()=>{const t=search.trim().toLowerCase();return expenses.filter(x=>(!t||x.title.toLowerCase().includes(t)||x.expenseNo.toLowerCase().includes(t)||x.category.toLowerCase().includes(t))&&(categoryFilter==="All"||x.category===categoryFilter))},[expenses,search,categoryFilter]);
  const stats=useMemo(()=>expenseStats(expenses),[expenses]);

  async function save(input:ExpenseInput){try{setSaving(true);const r=await fetch(editing?`/api/expenses/${editing.id}`:"/api/expenses",{method:editing?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to save expense.");await load();setShowModal(false);setEditing(null)}catch(e){alert(e instanceof Error?e.message:"Unable to save expense.")}finally{setSaving(false)}}
  async function remove(x:Expense){if(!confirm(`Delete ${x.title}?`))return;const r=await fetch(`/api/expenses/${x.id}`,{method:"DELETE"});const d=await r.json().catch(()=>({}));if(!r.ok)return alert(d.error||"Unable to delete expense.");await load()}

  return <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold">Expenses</h1><p className="mt-1 text-sm text-slate-500">Manage and track your business expenses</p></div><button onClick={()=>{setEditing(null);setShowModal(true)}} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white">+ Add Expense</button></div>
    <ExpenseStats stats={stats}/>
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="grid gap-3 border-b p-4 md:grid-cols-3"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search expense..." className="rounded-xl border bg-slate-50 px-4 py-3 text-sm"/><select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="rounded-xl border bg-slate-50 px-4 py-3 text-sm">{expenseCategories.map(x=><option key={x} value={x}>{x==="All"?"All Categories":x}</option>)}</select><div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Showing <b className="text-slate-900">{filtered.length}</b> expenses</div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[950px]"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr>{["Expense","Category","Amount","Payment","Date","Status","Actions"].map(x=><th key={x} className="px-5 py-4">{x}</th>)}</tr></thead><tbody>
      {loading?<tr><td colSpan={7} className="p-12 text-center">Loading...</td></tr>:filtered.length===0?<tr><td colSpan={7} className="p-12 text-center text-slate-500">No expenses found.</td></tr>:filtered.map(x=><tr key={x.id} className="border-t hover:bg-slate-50"><td className="px-5 py-4"><b>{x.title}</b><div className="text-xs text-slate-500">{x.expenseNo}</div></td><td className="px-5 py-4">{x.category}</td><td className="px-5 py-4 font-bold">{formatPrice(x.amount)}</td><td className="px-5 py-4">{x.paymentMethod}</td><td className="px-5 py-4">{x.date.slice(0,10)}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${x.status==="Paid"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{x.status}</span></td><td className="px-5 py-4"><div className="flex gap-2"><button onClick={()=>setSelected(x)} className="rounded-lg border px-3 py-2 text-xs font-bold">View</button><button onClick={()=>{setEditing(x);setShowModal(true)}} className="rounded-lg border px-3 py-2 text-xs font-bold">Edit</button><button onClick={()=>void remove(x)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600">Delete</button></div></td></tr>)}
      </tbody></table></div>
    </div>
  </div>{showModal&&<ExpenseModal expense={editing} saving={saving} onClose={()=>{setShowModal(false);setEditing(null)}} onSave={save}/>} {selected&&<ExpenseViewModal expense={selected} onClose={()=>setSelected(null)}/>}</div>
}
