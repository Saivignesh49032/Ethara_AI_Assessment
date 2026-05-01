import React, { useState, useEffect } from 'react';
import { 
  Activity as ActivityIcon, 
  User, 
  Clock, 
  MessageSquare,
  CheckCircle2,
  Trash2,
  Plus
} from 'lucide-react';
import { getProjectActivities } from '../../api/projects';
import { formatDistanceToNow } from 'date-fns';
import Skeleton from '../ui/Skeleton';
import Avatar from '../ui/Avatar';

const ActivityTab = ({ project }) => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        const data = await getProjectActivities(project.id);
        setActivities(data.activities || []);
      } catch (error) {
        console.error('Failed to load activities:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivities();
  }, [project.id]);

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATED_TASK': return <Plus size={14} className="text-green-400" />;
      case 'UPDATED_STATUS': return <CheckCircle2 size={14} className="text-blue-400" />;
      case 'DELETED_TASK': return <Trash2 size={14} className="text-red-400" />;
      default: return <ActivityIcon size={14} className="text-accent" />;
    }
  };

  const formatDetails = (activity) => {
    if (!activity.details) return '';
    try {
      const details = JSON.parse(activity.details);
      switch (activity.action) {
        case 'CREATED_TASK':
          return `created task "${details.title}"`;
        case 'UPDATED_STATUS':
          return `moved "${details.title}" to ${details.status.replace(/_/g, ' ')}`;
        case 'DELETED_TASK':
          return `deleted task "${details.title}"`;
        default:
          return 'performed an action';
      }
    } catch {
      return 'performed an action';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
        <ActivityIcon size={20} className="text-accent" /> Activity Log
      </h3>
      
      <div className="space-y-4 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-px before:bg-border">
        {activities.length > 0 ? activities.map((activity, i) => (
          <div key={activity.id} className="relative pl-12 group">
            <div className="absolute left-3 top-1 -translate-x-1/2 p-2 rounded-full bg-bg-secondary border border-border group-hover:border-accent/50 transition-colors z-10 shadow-sm">
              {getActionIcon(activity.action)}
            </div>
            <div className="bg-bg-secondary p-4 rounded-2xl border border-border hover:border-accent/30 transition-all">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <Avatar name={activity.user.name} size="xs" className="w-5 h-5 text-[8px]" />
                  <span className="text-sm font-bold text-text-primary">{activity.user.name}</span>
                  <span className="text-sm text-text-secondary">{formatDetails(activity)}</span>
                </div>
                <div className="flex items-center text-[10px] text-text-secondary uppercase tracking-tight">
                  <Clock size={12} className="mr-1" />
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="py-20 text-center text-text-secondary italic">
            No activity found for this project.
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTab;
