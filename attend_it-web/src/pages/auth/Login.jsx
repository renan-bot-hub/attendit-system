import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // UI TESTING BYPASS
    if (email === 'admin@test.com' && password === 'admin123') {
      localStorage.setItem('token', 'fake-admin-token-123');
      localStorage.setItem('user', JSON.stringify({ id: '999', name: 'Test Admin', role: 'admin' }));
      window.location.href = '/admin';
      return; 
    }

    if (email === 'teacher@test.com' && password === 'teacher123') {
      localStorage.setItem('token', 'fake-teacher-token-123');
      localStorage.setItem('user', JSON.stringify({ id: '888', name: 'Test Teacher', role: 'teacher' }));
      window.location.href = '/teacher'; 
      return; 
    }

    try {
      await authService.login({ email, password });
      window.location.href = '/teacher'; 
    } catch (err) {
      alert("Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-blue-600">ATTEND IT</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Welcome back! Please login to your dashboard.</p>
          
          <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded-lg border border-yellow-200 text-left">
            <p className="font-bold mb-1">Credentials:</p>
            <p>Admin: admin@test.com / admin123</p>
            <p>Teacher: teacher@test.com / teacher123</p>
          </div>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email Address" 
            className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            required 
          />
          <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-100 hover:bg-blue-700 transition">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}