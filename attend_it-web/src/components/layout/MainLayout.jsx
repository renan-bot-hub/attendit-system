import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function MainLayout() {
  // Security Check: If no token exists, kick them back to the login screen
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* 1. The Sidebar stays pinned to the left */}
      <Sidebar />
      
      {/* 2. The main content area on the right */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="p-4 md:p-8">
          {/* This Outlet is where your specific pages will magically appear! */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}