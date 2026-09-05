import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { ChatMessage, Task, ExternalCommitment } from '../types';

interface MessagesViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  tasks: Task[];
  commitments: ExternalCommitment[];
  onActionClick?: (actionType: string, payload?: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  messages,
  onSendMessage,
  tasks,
  commitments,
  onActionClick,
}) => {
  const [inputText, setInputText] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const quickPrompts = [
    'Rebalance today’s 30m overage',
    'Find 90 min before Sunday shift',
    'What tasks fit low energy now?',
  ];

  return (
    <div id="view-messages" className="flex flex-col h-full bg-[#F4F6F9]">
      {/* Shift awareness ticker banner */}
      <div 
        id="messages-shift-ticker"
        className="px-4 py-2.5 bg-white border-b border-slate-200/80 shrink-0 flex items-center justify-between text-xs select-none"
      >
        <div className="flex items-center gap-1.5 text-slate-500">
          <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
          <span className="font-medium">Retail Shift:</span>
        </div>
        <div className="flex items-center gap-1 text-slate-800 font-semibold">
          <span>Sun 14:30 — 21:15</span>
          <span className="text-[10px] text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded font-bold">
            Westport
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div 
        ref={scrollContainerRef}
        id="messages-list-scroll"
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-36 text-sm"
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          if (isUser) {
            return (
              <div key={msg.id} className="flex flex-col items-end space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span>{msg.timestamp}</span>
                  <span className="font-semibold text-slate-600">You</span>
                </div>
                <div className="bg-[#2563EB] text-white px-4 py-2.5 rounded-2xl rounded-tr-xs text-sm leading-relaxed max-w-[85%] shadow-xs">
                  {msg.text}
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex flex-col items-start space-y-1">
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <div className="w-4 h-4 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-[9px]">
                  AI
                </div>
                <span className="font-semibold text-slate-700">Shift Assistant</span>
                <span>{msg.timestamp}</span>
              </div>

              <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-xs border border-slate-200/80 text-sm leading-relaxed text-slate-800 max-w-[90%] shadow-xs">
                <div className="whitespace-pre-wrap">{msg.text}</div>
                
                {msg.suggestedAction && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <button
                      onClick={() => onActionClick?.(msg.suggestedAction!.actionType, msg.suggestedAction!.payload)}
                      className="inline-flex items-center gap-1.5 text-xs text-[#2563EB] font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition cursor-pointer"
                    >
                      <span>{msg.suggestedAction.label}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Prompt Bar & Input */}
      <div className="fixed bottom-[65px] left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 px-3 z-30 shadow-lg">
        {/* Quick Prompts Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSendMessage(prompt)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-[#2563EB] border border-slate-200/80 text-slate-600 whitespace-nowrap transition cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Field */}
        <form 
          onSubmit={handleSubmit}
          className="bg-slate-100 rounded-full px-3 py-1.5 border border-slate-200/80 flex items-center gap-2 focus-within:bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about shift buffers, tasks..."
            className="bg-transparent border-none outline-none text-xs sm:text-sm flex-1 text-slate-900 placeholder:text-slate-400 px-1"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-700 transition cursor-pointer shrink-0"
            title="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
