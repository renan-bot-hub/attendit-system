import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { authService } from '../../services/authService';

export default function MainLayout() {
  const user = authService.getCurrentUser();
  const token = localStorage.getItem('token');

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full pt-14 md:pt-0">
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
