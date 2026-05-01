import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Bookmark, 
  Bug, 
  CheckSquare, 
  Search,
  ArrowUpDown,
  User,
  Clock,
  LayoutList
} from 'lucide-react';
import { getProjectTasks, updateStatus, updateTask } from '../../api/tasks';
import { toast } from 'react-hot-toast';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import Skeleton from '../ui/Skeleton';
import TaskModal from '../kanban/TaskModal';

const BacklogTab = ({ project, isAdmin }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [project.id]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const data = await getProjectTasks(project.id);
      setTasks(data.tasks || []);
    } catch (error) {
      toast.error('Failed to load backlog');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTask = async (formData) => {
    try {
      if (selectedTask) {
        const data = isAdmin ? await updateTask(selectedTask.id, formData) : await updateStatus(selectedTask.id, formData.status);
        setTasks(tasks.map(t => t.id === selectedTask.id ? data.task : t));
        toast.success('Task updated');
      }
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'EPIC': return <Zap size={16} className="text-purple-400" />;
      case 'STORY': return <Bookmark size={16} className="text-green-400" />;
      case 'BUG': return <Bug size={16} className="text-red-400" />;
      default: return <CheckSquare size={16} className="text-blue-400" />;
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.status.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (sortOrder === 'asc') return valA > valB ? 1 : -1;
    return valA < valB ? 1 : -1;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-bg-secondary p-4 rounded-2xl border border-border">
        <div className="relative w-full sm:w-64 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-accent transition-colors" />
          <input
            type="text"
            placeholder="Filter by title..."
            className="w-full bg-bg-primary border border-border rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <p className="hidden md:block">Total Issues: <span className="text-text-primary font-bold">{tasks.length}</span></p>
          <div className="h-4 w-px bg-border hidden md:block"></div>
          <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2 hover:text-text-primary transition-colors font-medium"
          >
            <ArrowUpDown size={16} />
            Sort {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
          </button>
        </div>
      </div>

      <div className="bg-bg-secondary rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg-tertiary/20">
                <th className="px-4 py-3 text-xs font-bold text-text-secondary uppercase tracking-widest">Type</th>
                <th className="px-4 py-3 text-xs font-bold text-text-secondary uppercase tracking-widest">Issue</th>
                <th className="px-4 py-3 text-xs font-bold text-text-secondary uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-xs font-bold text-text-secondary uppercase tracking-widest">Priority</th>
                <th className="px-4 py-3 text-xs font-bold text-text-secondary uppercase tracking-widest">Assignee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredTasks.length > 0 ? filteredTasks.map(task => (
                <tr 
                  key={task.id} 
                  onClick={() => { setSelectedTask(task); setIsModalOpen(true); }}
                  className="hover:bg-bg-tertiary/30 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-4 w-16">
                    <div className="p-2 rounded-lg bg-bg-primary border border-border group-hover:border-accent/50 transition-colors inline-block">
                      {getTypeIcon(task.type)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors truncate max-w-md">{task.title}</p>
                      {task.parent && (
                        <p className="text-[10px] text-text-secondary mt-0.5 uppercase tracking-tight">{task.parent.title}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant="default" className="text-[10px] uppercase">{task.status.replace(/_/g, ' ')}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={task.priority} className="text-[10px] uppercase font-bold">{task.priority}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={task.assignee.name} size="sm" className="w-6 h-6 text-[10px]" />
                        <span className="text-xs text-text-secondary">{task.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-text-secondary/50 font-medium italic">Unassigned</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-text-secondary opacity-50">
                      <LayoutList size={48} className="mb-4" />
                      <p className="text-lg font-medium">No issues found.</p>
                      <p className="text-sm">Try adjusting your filters or creating a new task.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        task={selectedTask} 
        project={project} 
        isAdmin={isAdmin} 
        onSave={handleSaveTask}
        onRefresh={fetchTasks}
        onDelete={(id) => { 
          setTasks(tasks.filter(t => t.id !== id)); 
          setIsModalOpen(false); 
        }} 
      />
    </div>
  );
};

export default BacklogTab;
