import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicRoute = ({ children }) => {
  const { user } = useAuth();

  if (user && user.role) {
    const userRole = user.role.toLowerCase();
    const targetPath = (userRole === 'super_admin' || userRole === 'admin') ? '/admin/dashboard' : `/${userRole}/dashboard`;
    return <Navigate to={targetPath} replace />;
  }

  return children;
};

export default PublicRoute;