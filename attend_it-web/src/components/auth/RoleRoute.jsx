import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';

/**
 * Restricts a route to specific roles. Falls back to /login if logged out
 * or to the user's home dashboard if they're authenticated but unauthorized.
 *
 * Usage: <RoleRoute roles={['admin']}><AdminPage /></RoleRoute>
 */
export default function RoleRoute({ roles, children }) {
  const user = authService.getCurrentUser();
  const token = localStorage.getItem('token');

  if (!token || !user) return <Navigate to="/login" replace />;

  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(user.role)) {
    const home = user.role === 'admin' ? '/admin' :
                 user.role === 'student' ? '/student' : '/teacher';
    return <Navigate to={home} replace />;
  }

  return children;
}
