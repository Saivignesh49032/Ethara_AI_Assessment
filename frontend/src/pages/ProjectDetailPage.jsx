import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getProject } from '../api/projects';
import { toast } from 'react-hot-toast';
import Skeleton from '../components/ui/Skeleton';

// Feature components
import KanbanBoard from '../components/kanban/KanbanBoard';
import ProjectSettings from '../components/projects/ProjectSettings';
import MembersTab from '../components/projects/MembersTab';
import BacklogTab from '../components/projects/BacklogTab';
import ActivityTab from '../components/projects/ActivityTab';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Determine active tab from URL hash or default to 'board'
  const activeTab = location.hash.replace('#', '') || 'board';
  
  // Current user's role in this project
  const getMyRole = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr || !project?.members) return 'MEMBER';
      const user = JSON.parse(userStr);
      return project.members.find(m => m.user?.id === user.id)?.role || 'MEMBER';
    } catch {
      return 'MEMBER';
    }
  };

  const myRole = getMyRole();
  const isAdmin = myRole === 'ADMIN';

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      const data = await getProject(id);
      setProject(data.project);
    } catch (error) {
      toast.error('Failed to load project details');
      navigate('/projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    navigate(`#${tab}`, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-4 border-b border-border">
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-8 w-24 mb-2" />
        </div>
        <div className="grid grid-cols-4 gap-4 mt-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!project) return null;

  const tabs = [
    { id: 'board', label: 'Board', show: true },
    { id: 'backlog', label: 'Backlog', show: true },
    { id: 'activity', label: 'Activity', show: true },
    { id: 'members', label: 'Members', show: true },
    { id: 'settings', label: 'Settings', show: isAdmin }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'backlog':
        return <BacklogTab project={project} isAdmin={isAdmin} />;
      case 'activity':
        return <ActivityTab project={project} />;
      case 'members':
        return <MembersTab project={project} onUpdate={fetchProject} />;
      case 'settings':
        return isAdmin ? <ProjectSettings project={project} onUpdate={fetchProject} /> : null;
      case 'board':
      default:
        return <KanbanBoard project={project} isAdmin={isAdmin} />;
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex-shrink-0 space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-text-secondary mt-1">{project.description}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 border-b border-border">
          {tabs.filter(t => t.show).map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {renderContent()}
      </div>
    </div>
  );
};

export default ProjectDetailPage;
