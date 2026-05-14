import React, { useEffect, useState } from 'react';
import { Settings, Save, CheckCircle, School, Sliders, Phone } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { useSchool } from '../../context/useSchool';

export default function SystemConfig() {
  const { refresh } = useSchool();
  const [form, setForm] = useState({
    schoolName: '', schoolType: 'public', academicYear: '',
    consecutiveAbsenceThreshold: 3,
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
        setForm(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await settingsService.update(form);
      setForm(res.data);
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

  return (
    <div className="max-w-4xl mx-auto">

      <div className="mb-8 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">School Settings</h1>
          <p className="text-slate-500 mt-2">Configure school identity, attendance thresholds, and contact info.</p>
        </div>
        <div className="flex items-center gap-3">
          {success && (
            <span className="text-emerald-600 font-bold flex items-center text-sm">
              <CheckCircle className="w-4 h-4 mr-1" /> Saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-bold flex items-center text-sm shadow-sm"
          >
            <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}

      {/* School Identity */}
      <Section icon={<School className="w-5 h-5" />} title="School Identity">
        <Row label="School Name">
          <input className="cfg-input" value={form.schoolName}
            onChange={(e) => setForm({ ...form, schoolName: e.target.value })} />
        </Row>
        <Row label="School Type">
          <select className="cfg-input" value={form.schoolType}
            onChange={(e) => setForm({ ...form, schoolType: e.target.value })}>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </Row>
        <Row label="Academic Year">
          <input className="cfg-input" placeholder="2025-2026" value={form.academicYear}
            onChange={(e) => setForm({ ...form, academicYear: e.target.value })} />
        </Row>
      </Section>

      {/* Attendance thresholds */}
      <Section icon={<Sliders className="w-5 h-5" />} title="Attendance Thresholds">
        <p className="text-xs text-slate-500 mb-4">
          Risk tiers (each lower band is more severe). Set the upper attendance % for each tier.
        </p>
        <Row label="Critical below (%)" hint="Most severe — needs immediate action">
          <input type="number" min="0" max="100" className="cfg-input"
            value={form.attendanceCriticalBelow}
            onChange={(e) => setForm({ ...form, attendanceCriticalBelow: +e.target.value })} />
        </Row>
        <Row label="High Risk below (%)">
          <input type="number" min="0" max="100" className="cfg-input"
            value={form.attendanceHighRiskBelow}
            onChange={(e) => setForm({ ...form, attendanceHighRiskBelow: +e.target.value })} />
        </Row>
        <Row label="Moderate below (%)">
          <input type="number" min="0" max="100" className="cfg-input"
            value={form.attendanceModerateBelow}
            onChange={(e) => setForm({ ...form, attendanceModerateBelow: +e.target.value })} />
        </Row>
        <Row label="Consecutive absences flag" hint="Trigger an automatic risk flag after this many consecutive absences">
          <input type="number" min="1" max="30" className="cfg-input"
            value={form.consecutiveAbsenceThreshold}
            onChange={(e) => setForm({ ...form, consecutiveAbsenceThreshold: +e.target.value })} />
        </Row>
      </Section>

      {/* Contact info */}
      <Section icon={<Phone className="w-5 h-5" />} title="Contact Information">
        <Row label="Contact Email">
          <input type="email" className="cfg-input" value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
        </Row>
        <Row label="Contact Phone">
          <input className="cfg-input" value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
        </Row>
        <Row label="Address">
          <textarea className="cfg-input" rows="2" value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </Row>
      </Section>

      <style>{`.cfg-input{width:100%;padding:.625rem .75rem;border:1px solid #e2e8f0;border-radius:.5rem;font-size:.875rem;background:#fff;outline:none}.cfg-input:focus{box-shadow:0 0 0 2px rgba(59,130,246,.5);border-color:#3b82f6}`}</style>
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
