// 404 page shown when the user opens a route that does not exist.
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="text-center">
        <Compass className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h1 className="text-5xl font-black text-slate-900 mb-2">404</h1>
        <p className="text-slate-500 mb-6">The page you're looking for doesn't exist.</p>
        <Link
          to="/login"
          className="inline-block px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-sm"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
