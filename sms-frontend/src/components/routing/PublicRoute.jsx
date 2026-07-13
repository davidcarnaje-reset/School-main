import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicRoute = ({ children }) => {
  const { user } = useAuth();

  if (user && user.role) {
    const userRole = user.role.toLowerCase();
    let targetPath = `/${userRole}/dashboard`;
    if (userRole === 'super_admin') {
      const activeSchoolId = localStorage.getItem('selected_school_id');
      targetPath = activeSchoolId ? '/admin/dashboard' : '/admin/schools';
    } else if (userRole === 'admin') {
      targetPath = '/admin/dashboard';
    } else if (userRole === 'school_admin') {
      targetPath = '/school-admin/dashboard';
    }
    return <Navigate to={targetPath} replace />;
  }

  return children;
};

export default PublicRoute;