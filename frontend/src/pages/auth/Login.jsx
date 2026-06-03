// Login screen. Routes the user to /admin, /staff, or /teacher based on
// their role after a successful login.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import SchoolMark from '../../components/branding/SchoolMark';
import { authService } from '../../services/authService';
import { useSchool } from '../../context/useSchool';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { settings } = useSchool();

  const routeAfterLogin = (user) => {
    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'staff') navigate('/staff');
    else if (user.role === 'teacher') navigate('/teacher');
    else {
      setError('Web login is restricted to admin, teacher, and staff accounts.');
      authService.logout();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.login({ email, password });
      routeAfterLogin(data.user);
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach the backend API. Make sure the server is running on port 5000.');
      } else {
        setError(err.response?.data?.msg || err.response?.data?.message || err.response?.data?.error || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-screen flex items-center justify-center px-5 py-8">
      <main className="w-full max-w-[26rem]">
        <section className="text-center text-white mb-6">
          <SchoolMark className="w-24 h-24 mx-auto mb-4 drop-shadow-md" />
          <h1 className="text-2xl font-semibold leading-tight">
            {settings.schoolName}
          </h1>
          <p className="text-sm font-bold tracking-wider mt-2">MANILA</p>
          <p className="text-sm font-medium text-white/80 mt-1">
            AY {settings.academicYear}
          </p>
        </section>

        <section className="w-full bg-white border border-white/70 rounded-xl shadow-xl px-6 py-7 md:px-8 md:py-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-brand-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg outline-none text-sm focus:border-brand-500 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-brand-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg outline-none text-sm focus:border-brand-500 focus:ring-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60"
            >
              {loading ? 'Please wait...' : 'Sign In'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
