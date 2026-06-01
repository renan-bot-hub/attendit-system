// Authenticated layout shell — sidebar + main content. Redirects to
// /login if the user has no token cached.

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
    <div className="app-shell flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full pt-14 md:pt-0">
        <div className="app-content px-4 py-5 md:px-6 md:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
