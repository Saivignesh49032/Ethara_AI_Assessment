import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Bookmark, 
  Bug, 
  CheckSquare, 
  Plus, 
  X, 
  ChevronRight, 
  Clock,
  Calendar,
  User,
  AlignLeft
} from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { createTask, updateTask } from '../../api/tasks';
import { getAISuggestion } from '../../api/ai';
import { toast } from 'react-hot-toast';
import { Sparkles, Loader2 } from 'lucide-react';

const TaskModal = ({ isOpen, onClose, task, project, onSave, onRefresh, onDelete, isAdmin, columns }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: 'MEDIUM',
    type: 'TASK',
    dueDate: '',
    assigneeId: '',
    parentId: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'subtasks'

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || (columns?.[0]?.name || 'TODO'),
        priority: task.priority || 'MEDIUM',
        type: task.type || 'TASK',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        assigneeId: task.assignee?.id || '',
        parentId: task.parentId || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: columns?.[0]?.name || 'TODO',
        priority: 'MEDIUM',
        type: 'TASK',
        dueDate: '',
        assigneeId: '',
        parentId: ''
      });
    }
    setPrediction(null);
    setActiveTab('details');
  }, [task, isOpen, columns]);

  // AI Priority Suggestion
  useEffect(() => {
    if (task || !formData.title || formData.title.length < 5) {
      setPrediction(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsPredicting(true);
        const data = await getAISuggestion(formData.title);
        if (data.type !== formData.type || data.priority !== formData.priority) {
          setPrediction(data);
        }
      } catch (error) {
        console.error('Prediction error:', error);
      } finally {
        setIsPredicting(false);
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.title, task]);

  const applyPrediction = () => {
    if (!prediction) return;
    setFormData(prev => ({ 
      ...prev, 
      type: prediction.type, 
      priority: prediction.priority 
    }));
    setPrediction(null);
    toast.success('AI suggestions applied!', { icon: '✨' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSave(formData);
      onClose();
    } catch (err) {
      // toast handled in parent
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubtask = async (title) => {
    if (!title.trim() || !task) return;
    try {
      await createTask(project.id, {
        title,
        parentId: task.id,
        type: 'TASK',
        status: columns?.[0]?.name || 'TODO'
      });
      toast.success('Subtask added');
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Failed to add subtask');
    }
  };

  const memberOptions = [
    { value: '', label: 'Unassigned' },
    ...(project?.members?.map(m => ({
      value: m.user.id,
      label: m.user.name
    })) || [])
  ];

  const statusOptions = columns?.map(col => ({
    value: col.name,
    label: col.name.replace(/_/g, ' ')
  })) || [
    { value: 'TODO', label: 'To Do' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'IN_REVIEW', label: 'In Review' },
    { value: 'DONE', label: 'Done' }
  ];

  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' }
  ];

  const typeOptions = [
    { value: 'TASK', label: 'Task' },
    { value: 'STORY', label: 'Story' },
    { value: 'BUG', label: 'Bug' },
    { value: 'EPIC', label: 'Epic' }
  ];

  const canEditAll = isAdmin || !task;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'EPIC': return <Zap size={16} className="text-purple-400" />;
      case 'STORY': return <Bookmark size={16} className="text-green-400" />;
      case 'BUG': return <Bug size={16} className="text-red-400" />;
      default: return <CheckSquare size={16} className="text-blue-400" />;
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={
        <div className="flex items-center gap-2">
          {getTypeIcon(formData.type)}
          <span>{task ? task.title : 'New Issue'}</span>
        </div>
      }
      size="lg"
    >
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="flex border-b border-border mb-4">
          <button 
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          {task && (
            <button 
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'subtasks' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
              onClick={() => setActiveTab('subtasks')}
            >
              Subtasks ({task._count?.subtasks || 0})
            </button>
          )}
        </div>

        {activeTab === 'details' ? (
          <form onSubmit={handleSubmit} className="space-y-6 pt-2 overflow-y-auto max-h-[70vh] custom-scrollbar px-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Title & Description */}
              <div className="md:col-span-2 space-y-4">
                <Input
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={!canEditAll}
                  className="text-lg font-semibold"
                />

                {isPredicting && (
                  <div className="flex items-center gap-2 text-[10px] text-accent animate-pulse font-bold uppercase tracking-widest px-1">
                    <Loader2 size={12} className="animate-spin" /> Analyzing task intent...
                  </div>
                )}

                {prediction && (
                  <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-accent/20 text-accent">
                        <Sparkles size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text-primary">AI Suggestion</p>
                        <p className="text-[10px] text-text-secondary uppercase">
                          Set to <span className="text-accent">{prediction.type}</span> • <span className="text-accent">{prediction.priority}</span>?
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={applyPrediction}
                      className="text-[10px] font-bold bg-accent text-white px-3 py-1 rounded-lg hover:bg-accent-hover transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
                
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                    <AlignLeft size={16} /> Description
                  </label>
                  <textarea
                    name="description"
                    className="flex w-full rounded-md border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none min-h-[150px] disabled:opacity-50"
                    placeholder="Add a more detailed description..."
                    value={formData.description}
                    onChange={handleChange}
                    disabled={!canEditAll}
                  />
                </div>

                {task?.parent && (
                  <div className="p-3 bg-bg-tertiary/30 rounded-lg border border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary">Parent:</span>
                      {getTypeIcon(task.parent.type)}
                      <span className="text-sm font-medium text-text-primary">{task.parent.title}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Meta Info */}
              <div className="space-y-4 bg-bg-tertiary/20 p-4 rounded-xl border border-border">
                <Select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  options={statusOptions}
                />

                <Select
                  label="Priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  options={priorityOptions}
                  disabled={!canEditAll}
                />

                <Select
                  label="Type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  options={typeOptions}
                  disabled={!canEditAll}
                />

                <Select
                  label="Assignee"
                  name="assigneeId"
                  value={formData.assigneeId}
                  onChange={handleChange}
                  options={memberOptions}
                  disabled={!isAdmin && !!task}
                />

                <Input
                  label="Due Date"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleChange}
                  disabled={!canEditAll}
                />
              </div>
            </div>

            <div className="flex justify-between pt-6 mt-6 border-t border-border">
              {task && isAdmin ? (
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => onDelete(task.id)}
                >
                  Delete Task
                </Button>
              ) : (
                <div></div>
              )}
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSaving}>
                  {task ? 'Save Changes' : 'Create Issue'}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex flex-col h-full space-y-4 py-2">
            <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
              {task.subtasks?.length > 0 ? (
                task.subtasks.map(sub => (
                  <div key={sub.id} className="group flex items-center justify-between p-3 rounded-lg border border-border bg-bg-secondary hover:border-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <CheckSquare size={16} className="text-blue-400" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{sub.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={sub.priority} className="text-[10px] px-1 py-0">{sub.priority}</Badge>
                          <span className="text-[10px] text-text-secondary uppercase">{sub.status}</span>
                        </div>
                      </div>
                    </div>
                    {sub.assignee && (
                      <Avatar name={sub.assignee.name} size="sm" className="w-6 h-6 text-[10px]" />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  <p className="text-sm italic">No subtasks yet.</p>
                </div>
              )}
            </div>
            
            {isAdmin && (
              <div className="mt-auto pt-4 border-t border-border">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddSubtask(e.target.subtaskTitle.value);
                    e.target.subtaskTitle.value = '';
                  }}
                  className="flex gap-2"
                >
                  <input
                    name="subtaskTitle"
                    type="text"
                    className="flex-1 rounded-md border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Add a subtask..."
                  />
                  <Button type="submit" size="sm">
                    <Plus size={16} />
                  </Button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TaskModal;
