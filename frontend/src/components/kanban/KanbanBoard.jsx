import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  sortableKeyboardCoordinates, 
  SortableContext, 
  horizontalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { Plus, LayoutTemplate, Settings2, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { getProjectTasks, createTask, updateTask, updateStatus, deleteTask } from '../../api/tasks';
import { getColumns, createColumn, updateColumnPositions, deleteColumn as deleteColumnApi } from '../../api/columns';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import TaskFilters from './TaskFilters';
import AIModal from '../ai/AIModal';
import Button from '../ui/Button';

const KanbanBoard = ({ project, isAdmin }) => {
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  
  const [activeTask, setActiveTask] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColColor, setNewColColor] = useState('#94a3b8');
  
  const PRESET_COLORS = ['#94a3b8', '#3b82f6', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];
  
  const [filters, setFilters] = useState({ assigneeId: '', priority: '', type: '' });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchBoardData();
  }, [project.id]);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);

  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedTask)) {
        setSelectedTask(updated);
      }
    }
  }, [tasks, selectedTask]);

  const fetchBoardData = async () => {
    try {
      const [taskData, colData] = await Promise.all([
        getProjectTasks(project.id, { parentId: 'none' }),
        getColumns(project.id)
      ]);
      setTasks(taskData.tasks || []);
      setColumns(colData.columns || []);
    } catch (error) {
      toast.error('Failed to load board data');
    }
  };

  const applyFilters = () => {
    let result = [...tasks];
    if (filters.assigneeId) {
      if (filters.assigneeId === 'unassigned') result = result.filter(t => !t.assigneeId);
      else result = result.filter(t => t.assigneeId === filters.assigneeId);
    }
    if (filters.priority) result = result.filter(t => t.priority === filters.priority);
    if (filters.type) result = result.filter(t => t.type === filters.type);
    setFilteredTasks(result);
  };

  const handleDragStart = (event) => {
    const { active } = event;
    if (active.data.current?.type === 'Task') {
      setActiveTask(active.data.current.task);
    } else if (active.data.current?.type === 'Column') {
      setActiveColumn(active.data.current.column);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);
    setActiveColumn(null);
    
    if (!over) return;

    // Handle Column Sorting
    if (active.data.current?.type === 'Column' && over.data.current?.type === 'Column') {
      if (active.id !== over.id) {
        const oldIndex = columns.findIndex(c => c.id === active.id);
        const newIndex = columns.findIndex(c => c.id === over.id);
        const newCols = arrayMove(columns, oldIndex, newIndex);
        setColumns(newCols);
        
        try {
          await updateColumnPositions(project.id, newCols.map((c, i) => ({ id: c.id, position: i })));
        } catch (err) {
          toast.error('Failed to save column order');
          fetchBoardData(); // Revert
        }
      }
      return;
    }

    // Handle Task Moving
    if (active.data.current?.type === 'Task') {
      const activeId = active.id;
      let destinationColumnId = null;
      
      if (over.data.current?.type === 'Column') {
        destinationColumnId = over.data.current.column.name;
      } else if (over.data.current?.type === 'Task') {
        destinationColumnId = over.data.current.task.status;
      }

      const task = tasks.find(t => t.id === activeId);
      if (!task || !destinationColumnId || task.status === destinationColumnId) return;

      const previousTasks = [...tasks];
      setTasks(tasks.map(t => t.id === activeId ? { ...t, status: destinationColumnId } : t));

      try {
        await updateStatus(task.id, destinationColumnId);
      } catch (error) {
        setTasks(previousTasks);
        toast.error('Failed to move task');
      }
    }
  };

  const handleDeleteColumn = async (colId) => {
    if (!window.confirm('Delete this column? This only works if the column is empty.')) return;
    try {
      await deleteColumnApi(project.id, colId);
      setColumns(columns.filter(c => c.id !== colId));
      toast.success('Column deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete column');
    }
  };

  const handleQuickAdd = async (columnName, title) => {
    try {
      const data = await createTask(project.id, { title, status: columnName, type: 'TASK' });
      setTasks([data.task, ...tasks]);
    } catch (err) {
      toast.error('Failed to create task');
    }
  };

  const handleCreateColumn = async (e) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    try {
      const data = await createColumn(project.id, { 
        name: newColName.trim().toUpperCase().replace(/\s+/g, '_'),
        color: newColColor
      });
      setColumns([...columns, data.column]);
      setNewColName('');
      setNewColColor('#94a3b8');
      setIsColumnModalOpen(false);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleSaveTask = async (formData) => {
    if (selectedTask) {
      const data = isAdmin ? await updateTask(selectedTask.id, formData) : await updateStatus(selectedTask.id, formData.status);
      setTasks(tasks.map(t => t.id === selectedTask.id ? data.task : t));
      toast.success('Task updated');
    } else {
      const data = await createTask(project.id, formData);
      setTasks([data.task, ...tasks]);
      toast.success('Task created');
    }
  };

  return (
    <div className="flex flex-col h-full pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 flex-shrink-0 px-2">
        <TaskFilters filters={filters} setFilters={setFilters} project={project} />
        <div className="flex gap-2">
          {isAdmin && (
            <Button onClick={() => setIsColumnModalOpen(true)} variant="secondary" size="sm">
              <LayoutTemplate className="mr-2 h-4 w-4" /> Add Column
            </Button>
          )}
          <Button 
            onClick={() => setIsAIModalOpen(true)} 
            variant="secondary" 
            size="sm"
            className="!bg-gradient-to-r from-accent/20 to-purple-500/20 border-accent/30 hover:border-accent/50 text-accent"
          >
            <Sparkles className="mr-2 h-4 w-4" /> AI Generate
          </Button>
          <Button onClick={() => { setSelectedTask(null); setIsModalOpen(true); }} size="sm">
            <Plus className="mr-2 h-4 w-4" /> New Task
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto custom-scrollbar pb-4 px-2">
        <div className="flex items-start space-x-4 min-w-max pb-2">
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
              {columns.map(col => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  tasks={filteredTasks.filter(t => t.status === col.name)}
                  onTaskClick={(task) => { setSelectedTask(task); setIsModalOpen(true); }}
                  onQuickAdd={handleQuickAdd}
                  onDeleteColumn={handleDeleteColumn}
                  isAdmin={isAdmin}
                />
              ))}
            </SortableContext>

            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
              {activeTask && (
                <div className="opacity-80 rotate-3 scale-105 shadow-xl w-80">
                  <TaskCard task={activeTask} onClick={() => {}} />
                </div>
              )}
              {activeColumn && (
                <div className="opacity-80 rotate-2 scale-105 shadow-2xl w-80">
                  <KanbanColumn column={activeColumn} tasks={[]} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      <AIModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        projectId={project.id} 
        onRefresh={fetchBoardData} 
        columns={columns}
      />
      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} task={selectedTask} project={project} isAdmin={isAdmin} onSave={handleSaveTask} onRefresh={fetchBoardData} onDelete={(id) => { deleteTask(id); setTasks(tasks.filter(t => t.id !== id)); setIsModalOpen(false); }} columns={columns} />

      {isColumnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-bg-secondary p-6 rounded-2xl w-full max-w-sm border border-border shadow-2xl">
            <h3 className="text-lg font-bold mb-4">New Column</h3>
            <form onSubmit={handleCreateColumn}>
              <div className="mb-3">
                <label className="text-xs text-text-secondary mb-1 block">Column Name</label>
                <input autoFocus className="w-full border border-border bg-bg-tertiary px-3 py-2 rounded-xl text-sm focus:ring-2 focus:ring-accent outline-none" placeholder="e.g. TESTING" value={newColName} onChange={e => setNewColName(e.target.value)} />
              </div>
              <div className="mb-6">
                <label className="text-xs text-text-secondary mb-2 block">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button type="button" key={c} onClick={() => setNewColColor(c)} className={`w-6 h-6 rounded-full cursor-pointer transition-all ${newColColor === c ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg-secondary scale-110' : 'hover:scale-110'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsColumnModalOpen(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
