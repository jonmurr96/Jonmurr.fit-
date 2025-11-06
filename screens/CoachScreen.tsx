
import React, { useState, useRef, useEffect } from 'react';
import { AiMessage } from '../types';
import { getAICoachResponse } from '../services/geminiService';
import { BotIcon } from '../components/Icons';

export const CoachScreen: React.FC = () => {
  const [messages, setMessages] = useState<AiMessage[]>([
    { role: 'assistant', content: "Hello! I'm Jonmurr.fit, your AI coach. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: AiMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const response = await getAICoachResponse(messages, input);

    const assistantMessage: AiMessage = { role: 'assistant', content: response };
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full text-white">
      <header className="p-4 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-center">AI Coach</h1>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <BotIcon className="w-5 h-5 text-black" />
              </div>
            )}
            <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-green-500 text-black rounded-br-none' : 'bg-zinc-800 text-white rounded-bl-none'}`}>
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex items-start gap-3 justify-start">
                 <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <BotIcon className="w-5 h-5 text-black" />
                 </div>
                 <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-zinc-800 text-white rounded-bl-none">
                     <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-zinc-500 rounded-full animate-pulse delay-0"></span>
                        <span className="w-2 h-2 bg-zinc-500 rounded-full animate-pulse delay-100"></span>
                        <span className="w-2 h-2 bg-zinc-500 rounded-full animate-pulse delay-200"></span>
                     </div>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-black">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-full py-3 pl-5 pr-14 text-white focus:outline-none focus:border-green-500 transition-colors"
            disabled={isLoading}
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center" disabled={isLoading}>
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>
    </div>
  );
};
