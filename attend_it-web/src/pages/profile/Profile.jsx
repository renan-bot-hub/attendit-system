import React, { useEffect, useState } from 'react';
import { UserCircle, Lock, Save, KeyRound } from 'lucide-react';
import { userService } from '../../services/userService';

// "My Profile" page: edit own details + change own password
export default function Profile() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [pwdMsg, setPwdMsg] = useState({ text: '', type: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await userService.getMe();
        setMe(res.data);
      } catch (err) {
        setProfileMsg({ text: err.response?.data?.message || 'Failed to load profile.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Save edits to name / email / department / section
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ text: '', type: '' });
    try {
      const res = await userService.updateMe({
        name: me.name,
        email: me.email,
        department: me.department,
        section: me.section,
        gradeLevel: me.gradeLevel,
      });
      setMe(res.data);
      // Refresh localStorage cache used by sidebar etc.
      const cached = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...cached, name: res.data.name, email: res.data.email }));
      setProfileMsg({ text: 'Profile updated.', type: 'ok' });
    } catch (err) {
      setProfileMsg({ text: err.response?.data?.message || 'Update failed.', type: 'error' });
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMsg({ text: '', type: '' }), 3000);
    }
  };

  // Verify current password, then update to a new one
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg({ text: '', type: '' });
    if (pwd.newPassword !== pwd.confirm) {
      setPwdMsg({ text: 'New password and confirmation do not match.', type: 'error' });
      return;
    }
    setSavingPwd(true);
    try {
      await userService.changePassword(pwd.currentPassword, pwd.newPassword);
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
      setPwdMsg({ text: 'Password updated.', type: 'ok' });
    } catch (err) {
      setPwdMsg({ text: err.response?.data?.message || 'Password change failed.', type: 'error' });
    } finally {
      setSavingPwd(false);
      setTimeout(() => setPwdMsg({ text: '', type: '' }), 4000);
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Loading profile…</div>;
  if (!me) return <div className="p-8 text-red-600">Profile unavailable.</div>;

  const initials = me.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
        <p className="text-slate-500 mt-2">Update your details and password.</p>
      </div>

      {/* Identity card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-black">
          {initials}
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-slate-800">{me.name}</h2>
          <p className="text-slate-500 text-sm">{me.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
            {me.role}
          </span>
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-5 text-slate-700">
          <UserCircle className="w-5 h-5" />
          <h2 className="font-bold">Personal Information</h2>
        </div>

        {profileMsg.text && (
          <div className={`mb-4 p-3 text-sm rounded-lg border ${
            profileMsg.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>{profileMsg.text}</div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Field label="Full Name">
            <input className="profile-input" value={me.name}
              onChange={(e) => setMe({ ...me, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <input type="email" className="profile-input" value={me.email}
              onChange={(e) => setMe({ ...me, email: e.target.value })} />
          </Field>
          <Field label="Department">
            <input className="profile-input" value={me.department || ''}
              onChange={(e) => setMe({ ...me, department: e.target.value })} />
          </Field>
          <div className="flex justify-end">
            <button type="submit" disabled={savingProfile}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-lg text-sm flex items-center gap-2">
              <Save className="w-4 h-4" /> {savingProfile ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Password form */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-5 text-slate-700">
          <Lock className="w-5 h-5" />
          <h2 className="font-bold">Change Password</h2>
        </div>

        {pwdMsg.text && (
          <div className={`mb-4 p-3 text-sm rounded-lg border ${
            pwdMsg.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>{pwdMsg.text}</div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <Field label="Current Password">
            <input type="password" required className="profile-input" value={pwd.currentPassword}
              onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} />
          </Field>
          <Field label="New Password (min 6)">
            <input type="password" required minLength={6} className="profile-input" value={pwd.newPassword}
              onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} />
          </Field>
          <Field label="Confirm New Password">
            <input type="password" required className="profile-input" value={pwd.confirm}
              onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
          </Field>
          <div className="flex justify-end">
            <button type="submit" disabled={savingPwd}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold rounded-lg text-sm flex items-center gap-2">
              <KeyRound className="w-4 h-4" /> {savingPwd ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      <style>{`.profile-input{width:100%;padding:.625rem .75rem;border:1px solid #e2e8f0;border-radius:.5rem;font-size:.875rem;background:#fff;outline:none}.profile-input:focus{box-shadow:0 0 0 2px rgba(59,130,246,.5);border-color:#3b82f6}`}</style>
    </div>
  );
}

// Labeled form-field wrapper
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  );
}
