import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import Avatar from '../ui/Avatar';

const TopBar = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  
  // Basic breadcrumb logic
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length === 0) return null;

    return (
      <div className="flex items-center space-x-2 text-sm text-text-secondary">
        {paths.map((path, index) => {
          const isLast = index === paths.length - 1;
          const to = `/${paths.slice(0, index + 1).join('/')}`;
          const formattedPath = path.charAt(0).toUpperCase() + path.slice(1);
          
          return (
            <React.Fragment key={path}>
              {index > 0 && <span>/</span>}
              {isLast ? (
                <span className="font-medium text-text-primary">
                  {path.length > 20 ? `${path.substring(0, 8)}...` : formattedPath}
                </span>
              ) : (
                <Link to={to} className="hover:text-text-primary transition-colors">
                  {formattedPath}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border bg-bg-secondary flex-shrink-0">
      <div className="flex items-center flex-1">
        <button className="md:hidden p-2 -ml-2 mr-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-md">
          <Menu size={20} />
        </button>
        {getBreadcrumbs()}
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Mobile user info */}
        <div className="md:hidden flex items-center">
          <Avatar name={user?.name} size="sm" />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
