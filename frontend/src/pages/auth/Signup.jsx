// Public signup. Restricts roles to teacher / staff; first user in an
// empty DB is auto-promoted to admin by the backend.

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import SchoolMark from '../../components/branding/SchoolMark';
import { authService } from '../../services/authService';
import { useSchool } from '../../context/useSchool';

export default function Signup() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'teacher',
    department: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { settings } = useSchool();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.signup(form);
      if (res?.bootstrapAdmin) {
        alert('You are the first user - your account has been set as the system administrator. Please log in.');
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
    <div className="auth-page min-h-screen flex items-center justify-center p-5 md:p-8">
      <div className="auth-card max-w-lg w-full bg-white/90 p-6 md:p-7 rounded-xl shadow-md border border-slate-200">
        <div className="text-center mb-6 relative z-10">
          <SchoolMark className="w-20 h-20 mx-auto mb-3" />
          <h1 className="text-xl font-semibold text-slate-900">{settings.schoolName}</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Create account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg relative z-10">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4 relative z-10">
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

          <p className="text-xs text-slate-500 leading-5">
            Administrator accounts can only be created from inside the system by an existing admin.
            Students are managed as records by the admin. Parents access the system via the mobile app.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <UserPlus className="w-4 h-4" /> {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 relative z-10">
          Already have an account? <Link to="/login" className="text-brand-600 font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}
