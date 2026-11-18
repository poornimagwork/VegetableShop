import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ admin = false, children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return <p className="status-line">Checking your account…</p>;
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (admin && user.role !== 'admin') {
    return (
      <p className="notice notice-error" role="alert">
        This page is only available to the shop admin.
      </p>
    );
  }

  return children;
}

export default ProtectedRoute;
