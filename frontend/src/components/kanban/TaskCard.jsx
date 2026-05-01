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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className="bg-bg-secondary p-3 rounded-lg border border-border shadow-sm cursor-grab active:cursor-grabbing hover:border-accent/50 transition-colors group relative"
    >
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

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30">
        <div className="flex items-center space-x-3 text-text-secondary text-xs">
          {task.description && <AlignLeft size={14} title="Has description" />}
          
          {task._count?.subtasks > 0 && (
            <div className="flex items-center gap-1 text-accent" title={`${task._count.subtasks} subtasks`}>
              <CheckSquare size={14} />
              <span>{task._count.subtasks}</span>
            </div>
          )}

          {task.dueDate && (
            <div className={`flex items-center ${new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'text-red-400' : ''}`}>
              <Calendar size={14} className="mr-1" />
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
