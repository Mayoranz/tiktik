import { Navigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

export default function ProtectedRoute({ children, roles }) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    // Redirect to appropriate dashboard
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'operator') return <Navigate to="/operator" replace />;
    return <Navigate to="/" replace />;  // buyer → landing page
  }

  return children;
}
