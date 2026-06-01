// Route guard: redirects unauthenticated users to /login and users with
// the wrong role to their own dashboard.

import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';

export default function RoleRoute({ roles, children }) {
  const user = authService.getCurrentUser();
  const token = localStorage.getItem('token');

  if (!token || !user) return <Navigate to="/login" replace />;

  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(user.role)) {
    const home =
      user.role === 'admin'   ? '/admin'   :
      user.role === 'staff'   ? '/staff'   :
      user.role === 'teacher' ? '/teacher' : '/login';
    return <Navigate to={home} replace />;
  }

  return children;
}
