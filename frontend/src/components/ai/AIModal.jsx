import React, { useState } from 'react';
import { Sparkles, X, Send, Check, Loader2, ListTree } from 'lucide-react';
import { generateTasks } from '../../api/ai';
import { createTask } from '../../api/tasks';
import { toast } from 'react-hot-toast';
import Badge from '../ui/Badge';

const AIModal = ({ isOpen, onClose, projectId, onRefresh, columns }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    try {
      setIsGenerating(true);
      const data = await generateTasks(projectId, prompt);
      setGeneratedResult(data.generated);
    } catch (error) {
      toast.error('AI generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImport = async () => {
    if (!generatedResult) return;
    try {
      setIsImporting(true);
      
      // Find a suitable initial status (first column that isn't DONE/FINISHED)
      const todoColumn = columns?.find(c => 
        ['TODO', 'TO_DO', 'BACKLOG', 'TODO_LIST'].includes(c.name.toUpperCase())
      );
      const defaultStatus = todoColumn?.name || columns?.find(c => c.name.toUpperCase() !== 'DONE')?.name || columns?.[0]?.name || 'TODO';

      // Create main task
      const mainTaskData = await createTask(projectId, {
        title: generatedResult.title,
        description: generatedResult.description,
        type: generatedResult.type,
        priority: generatedResult.priority,
        status: defaultStatus
      });

      // Create subtasks sequentially
      for (const sub of generatedResult.subtasks) {
        await createTask(projectId, {
          title: sub.title,
          type: sub.type,
          priority: sub.priority,
          status: defaultStatus,
          parentId: mainTaskData.task.id
        });
      }

      toast.success('Tasks imported to board!');
      onRefresh();
      onClose();
      setGeneratedResult(null);
      setPrompt('');
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed partially. Please check your board.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-bg-secondary w-full max-w-2xl rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-accent/10 to-purple-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/20 text-accent animate-pulse">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">AI Task Generator</h2>
              <p className="text-xs text-text-secondary">Powered by Llama 3 via Groq</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-tertiary rounded-xl transition-colors">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {!generatedResult ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary uppercase tracking-wider">What's your goal?</label>
                <textarea
                  className="w-full h-32 bg-bg-primary border border-border rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all resize-none"
                  placeholder="e.g. 'Build a user authentication system with JWT' or 'Fix the mobile responsive layout bugs'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-text-secondary italic">
                AI will break this down into a structured Epic and several Subtasks with priorities.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              <div className="p-5 rounded-2xl bg-bg-primary border border-border space-y-3">
                <div className="flex justify-between items-start">
                  <Badge variant={generatedResult.priority}>{generatedResult.priority}</Badge>
                  <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded uppercase tracking-widest">{generatedResult.type}</span>
                </div>
                <h3 className="text-lg font-bold text-text-primary">{generatedResult.title}</h3>
                <p className="text-sm text-text-secondary">{generatedResult.description}</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                  <ListTree size={14} /> Suggested Breakdown
                </h4>
                <div className="space-y-2">
                  {generatedResult.subtasks.map((sub, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-bg-tertiary/30 border border-border/50">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent"></div>
                      <span className="text-sm flex-1 font-medium">{sub.title}</span>
                      <Badge variant={sub.priority} className="text-[9px]">{sub.priority}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-bg-tertiary/20 flex justify-end gap-3">
          {generatedResult ? (
            <>
              <button 
                onClick={() => setGeneratedResult(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-text-secondary hover:text-text-primary transition-colors"
              >
                Back
              </button>
              <button 
                onClick={handleImport}
                disabled={isImporting}
                className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-bold shadow-lg shadow-accent/20 hover:bg-accent-hover transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isImporting ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                Import to Board
              </button>
            </>
          ) : (
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-accent to-purple-600 text-white text-sm font-bold shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              Generate Breakdown
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIModal;
