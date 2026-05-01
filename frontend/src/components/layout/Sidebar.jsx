import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, LogOut, Layout } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import Avatar from '../ui/Avatar';

const Sidebar = () => {
  const { user, logout } = useAuthStore();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban }
  ];

  return (
    <aside className="w-64 border-r border-border bg-bg-secondary hidden md:flex flex-col flex-shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Layout className="h-6 w-6 text-accent mr-2" />
        <span className="text-xl font-bold tracking-tight">TaskFlow</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-border p-4">
        <div className="flex items-center">
          <Avatar name={user?.name} size="sm" />
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
            <p className="text-xs text-text-secondary truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="ml-2 text-text-secondary hover:text-red-400 p-1 rounded-md hover:bg-bg-tertiary transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
