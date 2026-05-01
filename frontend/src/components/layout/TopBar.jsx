import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Menu, Search, X, Zap, Bookmark, Bug, CheckSquare } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import Avatar from '../ui/Avatar';
import { searchTasks } from '../../api/tasks';

const TopBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const data = await searchTasks(searchQuery);
          setSearchResults(data.tasks || []);
          setShowResults(true);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'EPIC': return <Zap size={14} className="text-purple-400" />;
      case 'STORY': return <Bookmark size={14} className="text-green-400" />;
      case 'BUG': return <Bug size={14} className="text-red-400" />;
      default: return <CheckSquare size={14} className="text-blue-400" />;
    }
  };

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
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border bg-bg-secondary flex-shrink-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <button className="md:hidden p-2 -ml-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-md">
          <Menu size={20} />
        </button>
        <div className="hidden lg:block">
          {getBreadcrumbs()}
        </div>
      </div>

      <div className="flex-1 max-w-md mx-4 relative" ref={searchRef}>
        <div className="relative group">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchQuery ? 'text-accent' : 'text-text-secondary group-focus-within:text-accent'}`} />
          <input
            type="text"
            placeholder="Search tasks (e.g. 'Fix login')"
            className="w-full bg-bg-primary/50 border border-border rounded-xl py-2 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:bg-bg-primary transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-bg-tertiary rounded-full text-text-secondary"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-bg-secondary border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-text-secondary italic">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="p-2 space-y-1">
                  <p className="text-[10px] font-bold text-text-secondary uppercase px-3 py-1 tracking-widest">Tasks</p>
                  {searchResults.map(task => (
                    <button
                      key={task.id}
                      onClick={() => {
                        setShowResults(false);
                        setSearchQuery('');
                        navigate(`/projects/${task.project.id}`);
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-bg-tertiary rounded-xl transition-colors text-left group"
                    >
                      <div className="p-2 rounded-lg bg-bg-primary border border-border group-hover:border-accent/50 transition-colors">
                        {getTypeIcon(task.type)}
                      </div>
                      <div className="truncate flex-1">
                        <p className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors truncate">{task.title}</p>
                        <p className="text-[10px] text-text-secondary uppercase tracking-tight truncate">{task.project.name} • {task.status}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-text-secondary">No tasks found for "{searchQuery}"</p>
                </div>
              )}
            </div>
            {searchResults.length > 0 && (
              <div className="p-3 bg-bg-tertiary/30 border-t border-border text-center">
                <p className="text-[10px] text-text-secondary">Showing top results across all projects</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center gap-3 pr-2">
          <div className="text-right">
            <p className="text-xs font-bold text-text-primary leading-none">{user?.name}</p>
            <p className="text-[10px] text-text-secondary mt-1 uppercase tracking-tighter">Pro Account</p>
          </div>
          <Avatar name={user?.name} size="sm" />
        </div>
        <div className="md:hidden flex items-center">
          <Avatar name={user?.name} size="sm" />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
