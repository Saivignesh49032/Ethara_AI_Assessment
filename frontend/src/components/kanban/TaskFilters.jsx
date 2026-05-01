import React from 'react';
import { Filter, X } from 'lucide-react';
import Select from '../ui/Select';

const TaskFilters = ({ filters, setFilters, project }) => {
  const memberOptions = [
    { value: '', label: 'All Assignees' },
    { value: 'unassigned', label: 'Unassigned' },
    ...(project?.members?.map(m => ({
      value: m.user.id,
      label: m.user.name
    })) || [])
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' }
  ];

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'TASK', label: 'Tasks' },
    { value: 'STORY', label: 'Stories' },
    { value: 'BUG', label: 'Bugs' },
    { value: 'EPIC', label: 'Epics' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ assigneeId: '', priority: '', type: '' });
  };

  const hasActiveFilters = filters.assigneeId || filters.priority || filters.type;

  return (
    <div className="flex flex-wrap items-center gap-3 p-2 bg-bg-secondary/50 rounded-xl border border-border/50 backdrop-blur-sm">
      <div className="flex items-center text-text-secondary px-2">
        <Filter size={14} className="mr-2" />
        <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
      </div>
      
      <div className="w-36">
        <Select
          name="type"
          value={filters.type}
          onChange={handleChange}
          options={typeOptions}
          className="h-8 py-1 text-xs bg-bg-tertiary"
        />
      </div>

      <div className="w-40">
        <Select
          name="assigneeId"
          value={filters.assigneeId}
          onChange={handleChange}
          options={memberOptions}
          className="h-8 py-1 text-xs bg-bg-tertiary"
        />
      </div>
      
      <div className="w-36">
        <Select
          name="priority"
          value={filters.priority}
          onChange={handleChange}
          options={priorityOptions}
          className="h-8 py-1 text-xs bg-bg-tertiary"
        />
      </div>
      
      {hasActiveFilters && (
        <button 
          onClick={clearFilters}
          className="flex items-center gap-1 px-3 py-1 text-xs text-accent hover:text-accent-hover hover:bg-accent/10 rounded-full transition-colors font-medium border border-accent/20"
        >
          <X size={12} />
          Clear
        </button>
      )}
    </div>
  );
};

export default TaskFilters;
