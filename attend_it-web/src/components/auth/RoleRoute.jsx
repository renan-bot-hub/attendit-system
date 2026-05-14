import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';

// Gate a route by role. Unauthenticated -> /login. Wrong role -> own home.
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
