// Public signup. Restricts roles to teacher / staff; first user in an
// empty DB is auto-promoted to admin by the backend.

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, UserPlus } from 'lucide-react';
import { authService } from '../../services/authService';
import { useSchool } from '../../context/useSchool';

// Public signup page (teacher or student; first user auto-becomes admin)
export default function Signup() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'teacher',
    department: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { settings } = useSchool();

  // Submit the signup form; show a bootstrap notice if this user got admin
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.signup(form);
      if (res?.bootstrapAdmin) {
        alert('You are the first user — your account has been set as the system administrator. Please log in.');
      } else {
        alert('Account created. Please log in.');
      }
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.error || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-lg w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-center mb-6">
          <GraduationCap className="w-10 h-10 text-blue-600 mx-auto mb-2" />
          <h1 className="text-2xl font-black text-slate-900">{settings.schoolName}</h1>
          <p className="text-slate-500 text-xs uppercase tracking-widest font-bold mt-1">Create Account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name" required>
              <input type="text" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="auth-input" />
            </Field>
            <Field label="Role">
              <select value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="auth-input">
                <option value="teacher">Teacher / Faculty</option>
                <option value="staff">Staff (Prefect of Discipline)</option>
              </select>
            </Field>
          </div>

          <Field label="Email Address" required>
            <input type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@school.edu"
              className="auth-input" />
          </Field>

          <Field label="Password (min 6)" required>
            <input type="password" required minLength={6} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="auth-input" />
          </Field>

          <Field label="Department">
            <input type="text" value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="auth-input" />
          </Field>

          <p className="text-xs text-slate-500 italic">
            Administrator accounts can only be created from inside the system by an existing admin.
            Students are managed as records by the admin (no web login); parents access the system via the mobile app.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <UserPlus className="w-4 h-4" /> {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline">Log in</Link>
        </p>

        <style>{`.auth-input{width:100%;padding:.625rem .75rem;background:#fff;border:1px solid #e2e8f0;border-radius:.5rem;font-size:.875rem;outline:none}.auth-input:focus{box-shadow:0 0 0 2px rgba(59,130,246,.5);border-color:#3b82f6}`}</style>
      </div>
    </div>
  );
}

// Labeled form-field wrapper used inside this page
function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}
