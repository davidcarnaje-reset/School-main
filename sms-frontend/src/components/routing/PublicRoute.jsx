import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicRoute = ({ children }) => {
  const { user } = useAuth();

  if (user && user.role) {
    // ARCHITECT UPDATE: Ginawa nating lowercase ang role para saktong mag-match sa App.js routes mo!
    const userRole = user.role.toLowerCase();
    return <Navigate to={`/${userRole}/dashboard`} replace />;
  }

  return children;
};

export default PublicRoute;