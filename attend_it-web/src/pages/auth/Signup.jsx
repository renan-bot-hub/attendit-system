import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';

export default function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'teacher' });
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await authService.signup(formData);
      alert("Registration successful! You can now log in.");
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.msg || "Signup failed. Check if the email is already in use.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-blue-600">ATTEND_IT</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Create your school account</p>
        </div>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <input 
            type="text" 
            placeholder="Full Name" 
            className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            required
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
          
          <input 
            type="email" 
            placeholder="School Email" 
            className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            required
            onChange={e => setFormData({...formData, email: e.target.value})} 
          />
          
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            required
            onChange={e => setFormData({...formData, password: e.target.value})} 
          />
          
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Your Role</label>
            <select 
              className="w-full p-2 bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value})}
            >
              <option value="teacher">Teacher / Faculty</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-100 hover:bg-blue-700 transition duration-200">
            Register Account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 font-medium">
          Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
}