// School Settings (admin, Fig. 23). Identity, attendance time rules,
// case triggers, risk-band cutoffs, and contact info.

import React, { useEffect, useState } from 'react';
import { Save, CheckCircle, School, Sliders, Phone, Clock, AlertTriangle } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { useSchool } from '../../context/useSchool';

// School Settings — admin only.
// Adds the Attendance Rules & Thresholds card (manuscript Fig. 23):
//   late cutoff, end-of-day auto-absent, consecutive-absence trigger,
//   warning + high absence counts, plus the existing rate bands.
export default function SystemConfig() {
  const { refresh } = useSchool();
  const [form, setForm] = useState({
    schoolName: '', schoolType: 'public', academicYear: '',
    lateCutoffTime: '07:30', autoAbsentTime: '17:00',
    consecutiveAbsenceThreshold: 3, warningTotalAbsences: 3, criticalTotalAbsences: 5,
    attendanceCriticalBelow: 75, attendanceHighRiskBelow: 85, attendanceModerateBelow: 92,
    contactEmail: '', contactPhone: '', address: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await settingsService.get();
        setForm({ ...form, ...res.data });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await settingsService.update(form);
      setForm({ ...form, ...res.data });
      await refresh();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Loading settings…</div>;

  // Sanity check: thresholds must be in order
  const bandsOK = form.attendanceHighRiskBelow <= form.attendanceModerateBelow;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">School Settings</h1>
          <p className="text-slate-500 mt-2">School identity, attendance rules, and contact info.</p>
        </div>
        <div className="flex items-center gap-3">
          {success && <span className="text-emerald-600 font-bold flex items-center text-sm"><CheckCircle className="w-4 h-4 mr-1" /> Saved</span>}
          <button onClick={handleSave} disabled={saving}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-bold flex items-center text-sm shadow-sm">
            <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
      {!bandsOK && <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        Risk bands should satisfy: High % ≤ Moderate %.
      </div>}

      <Section icon={<School className="w-5 h-5" />} title="School Identity">
        <Row label="School Name">
          <input className="cfg-input" value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} />
        </Row>
        <Row label="School Type">
          <select className="cfg-input" value={form.schoolType} onChange={(e) => setForm({ ...form, schoolType: e.target.value })}>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </Row>
        <Row label="Academic Year">
          <input className="cfg-input" placeholder="2025-2026" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} />
        </Row>
      </Section>

      <Section icon={<Clock className="w-5 h-5" />} title="Attendance Rules">
        <p className="text-xs text-slate-500 mb-4">Used by attendance recording and the end-of-day finalizer to mark Late vs Absent automatically (Fig. 23).</p>
        <Row label="Late Cutoff Time" hint="Arrivals after this become 'Late' instead of 'Present'.">
          <input type="time" className="cfg-input" value={form.lateCutoffTime} onChange={(e) => setForm({ ...form, lateCutoffTime: e.target.value })} />
        </Row>
        <Row label="End-of-Day Auto-Absent" hint="Students still unmarked at this time are marked 'Absent'.">
          <input type="time" className="cfg-input" value={form.autoAbsentTime} onChange={(e) => setForm({ ...form, autoAbsentTime: e.target.value })} />
        </Row>
      </Section>

      <Section icon={<AlertTriangle className="w-5 h-5" />} title="Case Triggers">
        <p className="text-xs text-slate-500 mb-4">When these thresholds are crossed, the AI Alerts module surfaces the student and recommends an intervention.</p>
        <Row label="Consecutive absences flag" hint="Trigger an AI alert after N absences in a row.">
          <input type="number" min="1" max="30" className="cfg-input" value={form.consecutiveAbsenceThreshold}
            onChange={(e) => setForm({ ...form, consecutiveAbsenceThreshold: +e.target.value })} />
        </Row>
        <Row label="Warning total absences" hint="Open a Warning case once a student hits this many total absences.">
          <input type="number" min="1" max="50" className="cfg-input" value={form.warningTotalAbsences}
            onChange={(e) => setForm({ ...form, warningTotalAbsences: +e.target.value })} />
        </Row>
        <Row label="High absence trigger" hint="Escalate to POD at this count.">
          <input type="number" min="1" max="50" className="cfg-input" value={form.criticalTotalAbsences}
            onChange={(e) => setForm({ ...form, criticalTotalAbsences: +e.target.value })} />
        </Row>
      </Section>

      <Section icon={<Sliders className="w-5 h-5" />} title="Attendance Rate Bands">
        <p className="text-xs text-slate-500 mb-4">Used by Analytics + AI risk scoring. High is the most severe risk level.</p>
        <Row label="High below (%)"><input type="number" min="0" max="100" className="cfg-input" value={form.attendanceHighRiskBelow}
            onChange={(e) => setForm({ ...form, attendanceHighRiskBelow: +e.target.value })} /></Row>
        <Row label="Moderate below (%)"><input type="number" min="0" max="100" className="cfg-input" value={form.attendanceModerateBelow}
            onChange={(e) => setForm({ ...form, attendanceModerateBelow: +e.target.value })} /></Row>
      </Section>

      <Section icon={<Phone className="w-5 h-5" />} title="Contact Information">
        <Row label="Contact Email"><input type="email" className="cfg-input" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></Row>
        <Row label="Contact Phone"><input className="cfg-input" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></Row>
        <Row label="Address"><textarea className="cfg-input" rows="2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Row>
      </Section>

      <style>{`.cfg-input{width:100%;padding:.625rem .75rem;border:1px solid #e2e8f0;border-radius:.5rem;font-size:.875rem;background:#fff;outline:none}.cfg-input:focus{box-shadow:0 0 0 2px rgba(155,13,46,.25);border-color:#9B0D2E}`}</style>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      <div className="flex items-center gap-2 mb-5 text-slate-700">
        {icon}
        <h2 className="font-bold">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
      <div className="md:col-span-1">
        <p className="text-sm font-bold text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      </div>
      <div className="md:col-span-2">{children}</div>
    </div>
  );
}
