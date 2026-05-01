import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, X, MoreVertical, Trash2, GripHorizontal, Edit2, Check } from 'lucide-react';
import TaskCard from './TaskCard';
import { updateColumn } from '../../api/columns';
import { toast } from 'react-hot-toast';

const KanbanColumn = ({ column, tasks, onTaskClick, onQuickAdd, onDeleteColumn, isAdmin }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(column.name);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: column.name,
    data: {
      type: 'Column',
      column,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onQuickAdd(column.name, newTaskTitle.trim());
    setNewTaskTitle('');
    setIsAdding(false);
  };

  const handleRename = async () => {
    const formattedName = editName.trim().toUpperCase().replace(/\s+/g, '_');
    if (!formattedName || formattedName === column.name) {
      setIsEditingName(false);
      return;
    }
    try {
      await updateColumn(column.projectId, column.id, { name: formattedName });
      column.name = formattedName; // Optimistic update
      setIsEditingName(false);
      toast.success('Column renamed');
    } catch (err) {
      toast.error('Failed to rename column');
    }
  };

  if (isDragging) {
    return (
      <div
        ref={setSortableRef}
        style={style}
        className="flex flex-col flex-shrink-0 w-80 bg-bg-tertiary/10 border-2 border-dashed border-border rounded-xl h-full opacity-50"
      />
    );
  }

  return (
    <div 
      ref={setSortableRef}
      style={style}
      className="flex flex-col flex-shrink-0 w-80 bg-bg-tertiary/30 rounded-2xl max-h-[600px] group/column border border-border/50 overflow-hidden shadow-sm"
    >
      <div 
        className="p-3 flex items-center justify-between border-b border-border/50 sticky top-0 z-10 bg-bg-primary/80 backdrop-blur-md rounded-t-xl"
        style={{ borderTop: `3px solid ${column.color || '#94a3b8'}` }}
      >
        <div className="flex items-center space-x-2 overflow-hidden flex-1">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-bg-tertiary rounded text-text-secondary">
            <GripHorizontal size={14} />
          </div>
          
          {isEditingName ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                autoFocus
                className="bg-bg-tertiary text-xs font-bold px-2 py-1 rounded border border-accent w-full outline-none"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
              />
              <button onClick={handleRename} className="text-green-400 p-1"><Check size={14} /></button>
            </div>
          ) : (
            <>
              <h3 className="font-bold text-xs text-text-primary tracking-widest truncate uppercase">
                {column.name.replace(/_/g, ' ')}
              </h3>
              <span className="text-[10px] font-bold text-text-secondary bg-bg-tertiary px-2 py-0.5 rounded-full">
                {tasks?.length || 0}
              </span>
            </>
          )}
        </div>

        {isAdmin && (
          <div className="relative">
            <button 
              onClick={() => setShowActions(!showActions)}
              className="p-1 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
            >
              <MoreVertical size={16} />
            </button>
            
            {showActions && (
              <div className="absolute right-0 mt-2 w-48 bg-bg-secondary border border-border rounded-xl shadow-2xl z-50 p-1 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setIsEditingName(true);
                    setShowActions(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
                >
                  <Edit2 size={14} />
                  Rename Column
                </button>
                <div className="h-px bg-border my-1" />
                <button
                  onClick={() => {
                    onDeleteColumn(column.id);
                    setShowActions(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                  Delete Column
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div
        ref={setDroppableRef}
        className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] custom-scrollbar"
      >
        <SortableContext items={tasks?.map(t => t.id) || []} strategy={verticalListSortingStrategy}>
          {tasks?.map(task => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>

        {isAdding && (
          <form onSubmit={handleQuickAdd} className="bg-bg-secondary p-3 rounded-xl border border-accent shadow-lg mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <textarea
              autoFocus
              className="w-full bg-transparent text-sm text-text-primary focus:outline-none mb-3 resize-none min-h-[60px]"
              placeholder="Task title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleQuickAdd(e);
                }
                if (e.key === 'Escape') setIsAdding(false);
              }}
            />
            <div className="flex justify-end gap-2 border-t border-border/30 pt-2">
              <button type="button" onClick={() => setIsAdding(false)} className="text-xs text-text-secondary hover:text-text-primary px-2">Cancel</button>
              <button type="submit" className="bg-accent text-white px-3 py-1 text-xs rounded-lg font-bold hover:bg-accent-hover shadow-sm">Add Task</button>
            </div>
          </form>
        )}
      </div>

      {isAdmin && !isAdding && onQuickAdd && (
        <div className="p-2 border-t border-border/30 bg-bg-primary/20">
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center py-2 text-xs font-bold text-text-secondary hover:bg-bg-secondary hover:text-text-primary rounded-lg transition-all border border-transparent hover:border-border/50"
          >
            <Plus size={14} className="mr-1.5" /> ADD TASK
          </button>
        </div>
      )}
    </div>
  );
};

export default KanbanColumn;
