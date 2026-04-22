import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { REDDROP_ASSISTANT_PROMPT } from '../utils/redDropAssistantPrompt';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

export default function AiChatWidget() {
  const { askAi } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi, I am RedDrop Assistant. Need blood urgently? I can guide you to the Request page right now.',
    },
  ]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const reply = await askAi(`${REDDROP_ASSISTANT_PROMPT}\n\nUser: ${text}`);
      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: reply || 'I can help you create an emergency request at /emergency.',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: 'I am facing a temporary issue. Please try again, or go to /emergency to post a request.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9998]">
      {open && (
        <div className="w-[calc(100vw-2rem)] sm:w-[380px] h-[68vh] sm:h-[520px] bg-white border border-red-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="bg-[#b91c1c] text-white px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">RedDrop Assistant</h3>
              <p className="text-[11px] text-red-100">Fast help for requests and donors</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25"
            >
              <X size={14} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 bg-red-50/30">
            <div className="flex flex-col gap-2.5">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[86%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'self-end bg-[#b91c1c] text-white'
                      : 'self-start bg-white border border-red-100 text-slate-700'
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {loading && (
                <div className="self-start bg-white border border-red-100 text-slate-500 rounded-xl px-3 py-2 text-sm">
                  Thinking...
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-red-100 p-2.5 bg-white">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => navigate('/emergency')}
                className="text-xs bg-red-100 text-red-700 px-2.5 py-1.5 rounded-lg hover:bg-red-200"
              >
                Emergency Request
              </button>
              <button
                type="button"
                onClick={() => navigate('/donors')}
                className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-lg hover:bg-slate-200"
              >
                Find Donors
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type your message..."
                className="flex-1 border border-red-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="button"
                disabled={!canSend}
                onClick={handleSend}
                className="w-10 h-10 rounded-xl bg-[#b91c1c] text-white flex items-center justify-center disabled:opacity-50"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ml-auto h-12 px-4 rounded-full bg-[#b91c1c] text-white shadow-xl flex items-center gap-2 hover:bg-red-700"
        >
          <MessageCircle size={18} />
          <span className="text-sm font-semibold">AI Help</span>
        </button>
      )}
    </div>
  );
}
