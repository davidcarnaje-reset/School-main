import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    // Kung hindi naka-login, balik sa Login page
    return <Navigate to="/" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Kung naka-login pero bawal siya sa page na ito (e.g. Student pilit pumasok sa Admin)
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default ProtectedRoute;