import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, type }) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (type === 'admin' && auth.profile?.role !== 'admin') return <Navigate to="/" replace />;
  if (type !== 'admin' && auth.type !== type) return <Navigate to="/" replace />;
  return children;
}
