import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, MinusCircle, Maximize2 } from 'lucide-react';
import { chatWithAI } from '../../api/ai';
import { useParams } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import useAuthStore from '../../store/authStore';

const AIChatBubble = () => {
  const { id: projectId } = useParams();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (user && chatHistory.length === 0) {
      setChatHistory([
        { role: 'assistant', content: `Hi ${user.name}! I'm your AI project assistant. How can I help you with this project today?` }
      ]);
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isOpen, isMinimized]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading || !projectId) return;

    const userMessage = { role: 'user', content: message };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const historyForAI = chatHistory.slice(-5).map(m => ({ role: m.role, content: m.content }));
      const data = await chatWithAI(projectId, message, historyForAI);
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!projectId) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-[100] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className={`bg-bg-secondary border border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col transition-all duration-300 mb-4 ${isMinimized ? 'h-16 w-72' : 'h-[500px] w-[350px] sm:w-[400px]'}`}>
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-accent to-purple-600 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 text-white">
              <Bot size={20} />
              <span className="font-bold text-sm">Project Co-Pilot</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-white/20 rounded-lg text-white transition-colors">
                {isMinimized ? <Maximize2 size={16} /> : <MinusCircle size={16} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg text-white transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-bg-primary/30">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="flex-shrink-0 mt-1">
                        {msg.role === 'user' ? (
                          <Avatar name={user?.name} size="xs" className="w-6 h-6 text-[8px]" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center border border-accent/20">
                            <Bot size={12} />
                          </div>
                        )}
                      </div>
                      <div className={`p-3 rounded-2xl text-sm ${
                        msg.role === 'user' 
                          ? 'bg-accent text-white rounded-tr-none' 
                          : 'bg-bg-secondary border border-border rounded-tl-none text-text-primary shadow-sm'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-2 items-center bg-bg-secondary border border-border p-3 rounded-2xl rounded-tl-none">
                      <Loader2 size={14} className="animate-spin text-accent" />
                      <span className="text-xs text-text-secondary italic font-medium">AI is thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-border bg-bg-secondary">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ask about your project..."
                    className="w-full bg-bg-primary border border-border rounded-xl py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isLoading}
                  />
                  <button 
                    type="submit"
                    disabled={isLoading || !message.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-accent to-purple-600 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group relative"
        >
          <div className="absolute inset-0 rounded-full bg-accent animate-ping opacity-20 group-hover:hidden"></div>
          <MessageSquare size={24} className="group-hover:hidden" />
          <Bot size={24} className="hidden group-hover:block animate-in zoom-in duration-200" />
        </button>
      )}
    </div>
  );
};

export default AIChatBubble;
