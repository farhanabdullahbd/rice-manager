import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function PrivateRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
}
