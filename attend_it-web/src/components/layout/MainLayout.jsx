import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function MainLayout() {

  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
    
      <Sidebar />
      
    
      <main className="flex-1 overflow-y-auto w-full">
        <div className="p-4 md:p-8">
        
          <Outlet />
        </div>
      </main>
    </div>
  );
}