import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Lock, Mail, ArrowRight } from 'lucide-react';
import { authService } from '../../services/authService';
import { useSchool } from '../../context/useSchool';

// Two-pane login screen with school branding
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { settings } = useSchool();

  // Authenticate then route to the user's dashboard based on role
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.login({ email, password });
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'teacher') navigate('/teacher');
      else navigate('/student');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left: brand panel */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <GraduationCap className="w-10 h-10 text-blue-400" />
            <h1 className="text-3xl font-black tracking-tight">{settings.schoolName}</h1>
          </div>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">
            {settings.schoolType} school • AY {settings.academicYear}
          </p>
        </div>

        <div>
          <h2 className="text-5xl font-black mb-4 leading-tight">
            Attendance,<br />done right.
          </h2>
          <p className="text-slate-300 max-w-md leading-relaxed">
            Track attendance, communicate with parents, manage cases, and get prescriptive
            insights — all in one secure dashboard for administrators, teachers, and students.
          </p>
        </div>

        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} {settings.schoolName}. Powered by Attend IT.
        </p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="md:hidden text-center mb-8">
            <GraduationCap className="w-12 h-12 text-blue-600 mx-auto mb-2" />
            <h1 className="text-2xl font-black text-slate-900">{settings.schoolName}</h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">
              {settings.schoolType} • AY {settings.academicYear}
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 mt-2">Sign in to access your dashboard.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              {loading ? 'Signing in…' : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            New here? <Link to="/signup" className="text-blue-600 font-bold hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
