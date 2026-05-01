import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Columns, Settings, User } from 'lucide-react';

const MobileNav = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-secondary border-t border-border flex items-center justify-around px-2 z-50">
      <NavLink 
        to="/" 
        className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-accent' : 'text-text-secondary'}`}
      >
        <LayoutDashboard size={20} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
      </NavLink>
      <NavLink 
        to="/projects" 
        className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-accent' : 'text-text-secondary'}`}
      >
        <Columns size={20} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Projects</span>
      </NavLink>
      <NavLink 
        to="/profile" 
        className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-accent' : 'text-text-secondary'}`}
      >
        <User size={20} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Profile</span>
      </NavLink>
      <NavLink 
        to="/settings" 
        className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-accent' : 'text-text-secondary'}`}
      >
        <Settings size={20} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Settings</span>
      </NavLink>
    </nav>
  );
};

export default MobileNav;
