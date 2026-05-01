import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { Calendar, AlignLeft, CheckSquare, Bookmark, Bug, Zap } from 'lucide-react';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';

const TaskCard = ({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 border-2 border-accent border-dashed rounded-lg bg-bg-secondary h-[100px]"
      />
    );
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'EPIC': return <Zap size={14} className="text-purple-400" title="Epic" />;
      case 'STORY': return <Bookmark size={14} className="text-green-400" title="Story" />;
      case 'BUG': return <Bug size={14} className="text-red-400" title="Bug" />;
      case 'TASK':
      default: return <CheckSquare size={14} className="text-blue-400" title="Task" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'EPIC': return 'border-l-purple-500';
      case 'STORY': return 'border-l-green-500';
      case 'BUG': return 'border-l-red-500';
      case 'TASK':
      default: return 'border-l-blue-500';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
  const isDueSoon = task.dueDate && new Date(task.dueDate) > new Date() && new Date(task.dueDate) < new Date(Date.now() + 48 * 60 * 60 * 1000) && task.status !== 'DONE';

  const subtasksTotal = task._count?.subtasks || 0;
  const subtasksDone = task.subtasks?.filter(s => s.status === 'DONE').length || 0;
  const progressPercent = subtasksTotal > 0 ? (subtasksDone / subtasksTotal) * 100 : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={`bg-bg-secondary p-3 rounded-lg border border-border shadow-sm cursor-grab active:cursor-grabbing hover:border-accent/50 transition-colors group relative border-l-[3px] ${getTypeColor(task.type)}`}
    >
      {task.parent && (
        <div className="mb-1.5">
           <span className="text-[9px] uppercase font-bold text-text-secondary bg-bg-tertiary px-1.5 py-0.5 rounded border border-border/50 truncate max-w-full inline-block">
             {task.parent.title}
           </span>
        </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {getTypeIcon(task.type)}
          <Badge variant={task.priority} className="text-[10px] px-1.5 py-0 h-4">
            {task.priority}
          </Badge>
        </div>
      </div>
      
      <p className="text-sm font-medium text-text-primary mb-3 line-clamp-2 leading-snug">
        {task.title}
      </p>

      {subtasksTotal > 0 && (
        <div className="mb-3 space-y-1">
          <div className="flex justify-between text-[10px] text-text-secondary font-medium">
            <span className="flex items-center gap-1"><CheckSquare size={10} /> {subtasksDone}/{subtasksTotal} subtasks</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-bg-tertiary rounded-full h-1">
            <div className={`h-1 rounded-full ${progressPercent === 100 ? 'bg-green-500' : 'bg-accent'}`} style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30">
        <div className="flex items-center space-x-3 text-text-secondary text-xs">
          {task.description && <AlignLeft size={14} title="Has description" />}
          
          {task.dueDate && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-400 font-medium' : isDueSoon ? 'text-orange-400 font-medium animate-pulse' : ''}`}>
              <Calendar size={14} />
              <span>{format(new Date(task.dueDate), 'MMM d')}</span>
            </div>
          )}
        </div>
        
        {task.assignee && (
          <Avatar name={task.assignee.name} size="sm" className="w-6 h-6 text-[10px]" />
        )}
      </div>
    </div>
  );
};

export default TaskCard;
