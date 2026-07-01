"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { BellRing, BrainCircuit, Database, Edit3, Save, ShieldCheck, X } from "lucide-react";
import { SETTING_STATUS_TONES, type SettingStatusTone } from "@/lib/system-settings";

type Setting = {
  id: string;
  key: string;
  title: string;
  description: string;
  iconKey: string;
  status: string;
  statusTone: string;
  sortOrder: number;
  updatedAt: Date | string;
};

const icons = {
  shield: ShieldCheck,
  database: Database,
  bell: BellRing,
  brain: BrainCircuit,
};

const toneClasses: Record<SettingStatusTone, string> = {
  green: "badge-green",
  amber: "badge-amber",
  red: "badge-red",
  blue: "badge-blue",
  gray: "badge-gray",
};

const toneOptions = SETTING_STATUS_TONES.map((tone) => ({
  value: tone,
  label: tone.charAt(0).toUpperCase() + tone.slice(1),
}));

async function updateSetting(id: string, payload: Pick<Setting, "title" | "description" | "status" | "statusTone">) {
  const res = await fetch(`/api/settings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.error ?? "Failed to update setting");
  return data.data as Setting;
}

export default function SettingsPanel({ initialSettings }: { initialSettings: Setting[] }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [editing, setEditing] = useState<Setting | null>(null);
  const [form, setForm] = useState({ title: "", description: "", status: "", statusTone: "green" });
  const [saving, setSaving] = useState(false);

  const openEdit = (setting: Setting) => {
    setEditing(setting);
    setForm({
      title: setting.title,
      description: setting.description,
      status: setting.status,
      statusTone: setting.statusTone,
    });
  };

  const save = async () => {
    if (!editing) return;
    if (!form.title.trim() || !form.description.trim() || !form.status.trim()) {
      toast.error("Fill in all setting fields");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateSetting(editing.id, {
        title: form.title,
        description: form.description,
        status: form.status,
        statusTone: form.statusTone,
      });
      setSettings((prev) => prev.map((setting) => (setting.id === updated.id ? updated : setting)));
      setEditing(null);
      toast.success("Setting saved");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message ?? "Failed to save setting");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {settings.map((item) => {
          const Icon = icons[item.iconKey as keyof typeof icons] ?? ShieldCheck;
          const badgeClass = toneClasses[item.statusTone as SettingStatusTone] ?? "badge-gray";
          return (
            <div key={item.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">{item.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-gray-500">{item.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`badge ${badgeClass}`}>{item.status}</span>
                  <button type="button" onClick={() => openEdit(item)} className="btn-secondary px-2.5 py-1.5 text-xs">
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="modal-overlay">
          <div className="modal-box max-w-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">Edit Setting</h3>
              <button type="button" onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className="input resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Status</label>
                  <input value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Badge Tone</label>
                  <select value={form.statusTone} onChange={(event) => setForm({ ...form, statusTone: event.target.value })} className="input">
                    {toneOptions.map((tone) => (
                      <option key={tone.value} value={tone.value}>{tone.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={save} disabled={saving} className="btn-primary flex-1">
                  {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : "Save Setting"}
                </button>
                <button type="button" onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
