"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Search, Plus, X, ShieldAlert, CheckCircle2 } from "lucide-react";
import { getSeverityColor, cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Medicine { id: string; name: string; dosage: string; }
interface Interaction {
  id: string; severity: string; description: string; recommendation: string | null; source: string | null;
  drugA: { name: string; dosage: string }; drugB: { name: string; dosage: string };
}

const severityOrder = ["CONTRAINDICATED", "SEVERE", "MODERATE", "MILD"];

export default function InteractionsPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [drugA, setDrugA] = useState("");
  const [drugB, setDrugB] = useState("");
  const [checkResult, setCheckResult] = useState<Interaction | null | "none">(null);
  const [checking, setChecking] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newInteraction, setNewInteraction] = useState({ drugAId: "", drugBId: "", severity: "MODERATE", description: "", recommendation: "", source: "" });

  useEffect(() => {
    fetch("/api/medicines?active=true").then(r => r.json()).then(d => { if (d.success) setMedicines(d.data); });
    fetch("/api/interactions").then(r => r.json()).then(d => { if (d.success) setInteractions(d.data); });
  }, []);

  const checkInteraction = async () => {
    if (!drugA || !drugB) return toast.error("Select both drugs");
    if (drugA === drugB) return toast.error("Select two different drugs");
    setChecking(true);
    try {
      const res = await fetch(`/api/interactions?drugA=${drugA}&drugB=${drugB}`);
      const data = await res.json();
      setCheckResult(data.data ?? "none");
    } catch { toast.error("Check failed"); }
    finally { setChecking(false); }
  };

  const addInteraction = async () => {
    if (!newInteraction.drugAId || !newInteraction.drugBId || !newInteraction.description) return toast.error("Fill in all required fields");
    try {
      const res = await fetch("/api/interactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newInteraction) });
      const data = await res.json();
      if (data.success) {
        toast.success("Interaction recorded");
        setInteractions(prev => [data.data, ...prev]);
        setShowForm(false);
        setNewInteraction({ drugAId: "", drugBId: "", severity: "MODERATE", description: "", recommendation: "", source: "" });
      } else toast.error(data.error ?? "Failed");
    } catch { toast.error("Something went wrong"); }
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Drug Safety</h1>
          <p className="page-subtitle">Check interactions before dispensing and maintain the pharmacy safety knowledge base.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Interaction
        </button>
      </div>

      {/* Checker */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-teal-600" />
          <p className="text-sm font-bold text-gray-800">Drug Interaction Checker</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="label">Drug A</label>
            <select value={drugA} onChange={e => { setDrugA(e.target.value); setCheckResult(null); }} className="input">
              <option value="">Select drug</option>
              {medicines.map(m => <option key={m.id} value={m.id}>{m.name} ({m.dosage})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Drug B</label>
            <select value={drugB} onChange={e => { setDrugB(e.target.value); setCheckResult(null); }} className="input">
              <option value="">Select drug</option>
              {medicines.filter(m => m.id !== drugA).map(m => <option key={m.id} value={m.id}>{m.name} ({m.dosage})</option>)}
            </select>
          </div>
          <button onClick={checkInteraction} disabled={checking} className="btn-primary h-10">
            {checking ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" /> : <Search className="w-4 h-4" />}
            Check
          </button>
        </div>

        {checkResult && (
          <div className="mt-4 fade-in">
            {checkResult === "none" ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-emerald-700 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" /> No known interaction between these two drugs.
              </div>
            ) : (
              <div className={cn("rounded-xl border px-5 py-4", getSeverityColor(checkResult.severity))}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-bold text-sm">{checkResult.severity} INTERACTION</span>
                </div>
                <p className="text-sm font-semibold">{checkResult.drugA.name} ↔ {checkResult.drugB.name}</p>
                <p className="text-sm mt-2 leading-relaxed">{checkResult.description}</p>
                {checkResult.recommendation && <p className="text-sm mt-2 font-medium">💡 {checkResult.recommendation}</p>}
                {checkResult.source && <p className="text-xs mt-2 opacity-70">Source: {checkResult.source}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* All interactions */}
      <div className="card overflow-hidden">
        <div className="section-head">
          <div>
            <p className="section-title">Recorded Interactions</p>
            <p className="section-sub">{interactions.length} entries · sorted by severity</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{["Drug A","Drug B","Severity","Description","Recommendation"].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {interactions.length === 0 ? (
                <tr><td colSpan={5} className="table-td text-center py-16 text-gray-400">
                  <div className="empty-state">
                    <ShieldAlert className="w-8 h-8 text-gray-300 mb-2" />
                    No interactions recorded yet
                  </div>
                </td></tr>
              ) : interactions.slice().sort((a,b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)).map(i => (
                <tr key={i.id} className="table-row">
                  <td className="table-td font-semibold text-gray-900">{i.drugA.name} <span className="text-gray-400 text-xs font-normal">{i.drugA.dosage}</span></td>
                  <td className="table-td font-semibold text-gray-900">{i.drugB.name} <span className="text-gray-400 text-xs font-normal">{i.drugB.dosage}</span></td>
                  <td className="table-td"><span className={cn("badge", getSeverityColor(i.severity))}>{i.severity}</span></td>
                  <td className="table-td max-w-xs"><p className="truncate text-gray-600">{i.description}</p></td>
                  <td className="table-td max-w-xs"><p className="truncate text-gray-400">{i.recommendation ?? "—"}</p></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">Record Drug Interaction</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Drug A *</label>
                  <select value={newInteraction.drugAId} onChange={e => setNewInteraction({ ...newInteraction, drugAId: e.target.value })} className="input">
                    <option value="">Select</option>
                    {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Drug B *</label>
                  <select value={newInteraction.drugBId} onChange={e => setNewInteraction({ ...newInteraction, drugBId: e.target.value })} className="input">
                    <option value="">Select</option>
                    {medicines.filter(m => m.id !== newInteraction.drugAId).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Severity *</label>
                <select value={newInteraction.severity} onChange={e => setNewInteraction({ ...newInteraction, severity: e.target.value })} className="input">
                  <option value="MILD">Mild</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="SEVERE">Severe</option>
                  <option value="CONTRAINDICATED">Contraindicated</option>
                </select>
              </div>
              <div>
                <label className="label">Description *</label>
                <textarea rows={3} value={newInteraction.description} onChange={e => setNewInteraction({ ...newInteraction, description: e.target.value })} className="input resize-none" placeholder="Describe the interaction…" />
              </div>
              <div>
                <label className="label">Recommendation</label>
                <input value={newInteraction.recommendation} onChange={e => setNewInteraction({ ...newInteraction, recommendation: e.target.value })} className="input" placeholder="Clinical recommendation…" />
              </div>
              <div>
                <label className="label">Source</label>
                <input value={newInteraction.source} onChange={e => setNewInteraction({ ...newInteraction, source: e.target.value })} className="input" placeholder="e.g. WHO Drug Database" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={addInteraction} className="btn-primary flex-1">Save Interaction</button>
                <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
