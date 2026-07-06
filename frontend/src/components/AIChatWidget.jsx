import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Load chat history when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const fetchHistory = async () => {
        try {
          setIsLoading(true);
          const res = await apiClient.get('/ai/chat');
          if (res.data.history.length > 0) {
            setMessages(res.data.history);
          } else {
            // Add a default welcome message if no history
            setMessages([{
              id: 'welcome',
              sender: 'ai',
              message: "Hi! I'm your EliteMart AI assistant. I can help you with product reliability questions, return policies, or check on your orders. How can I help you today?"
            }]);
          }
        } catch (err) {
          console.error("Failed to load chat history:", err);
          toast.error("Failed to connect to AI assistant.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    
    // Optimistically add user message to UI
    const tempId = Date.now().toString();
    setMessages(prev => [...prev, { id: tempId, sender: 'user', message: userMessage }]);
    setIsLoading(true);

    try {
      const res = await apiClient.post('/ai/chat', { message: userMessage });
      // Add AI response
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', message: res.data.reply }]);
    } catch (err) {
      toast.error("Failed to send message.");
      // Remove the optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-xl hover:bg-primary-dark transition-all hover:scale-105 z-50 group flex items-center justify-center"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute right-full mr-4 bg-slate-900 text-white text-sm px-3 py-1.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Need help? Chat with AI
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 bg-surface shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-[80vw] h-[80vh] md:w-[600px] md:h-[700px] rounded-2xl' : 'w-80 sm:w-96 h-[500px] rounded-xl'
        }`}>
          {/* Header */}
          <div className="bg-primary text-white p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">EliteMart AI</h3>
                <p className="text-xs text-primary-light/80 opacity-80">Always here to help</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-white/80 hover:text-white"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
            {messages.map((msg, idx) => (
              <div key={msg.id || idx} className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-primary/10 text-primary'
                }`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-3 rounded-2xl text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-primary text-white rounded-tr-sm' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-2 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about returns, policies, or products..."
                className="flex-1 border border-slate-300 rounded-full pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-primary text-white w-9 rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -ml-0.5" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
