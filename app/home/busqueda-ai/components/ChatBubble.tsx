// app/home/busqueda-ai/components/ChatBubble.tsx
'use client';

import type { ReactNode } from 'react';
import { User, Sparkles } from 'lucide-react';

interface ChatBubbleProps {
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
  children?: ReactNode;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatBubble({ role, text, timestamp, children }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-2 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* AI avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`max-w-[80%] md:max-w-[70%] ${isUser ? 'order-first' : ''}`}>
        {/* Bubble */}
        <div
          className={`
            px-4 py-3 rounded-2xl shadow-sm
            ${isUser
              ? 'bg-[#c54141] text-white rounded-br-sm'
              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
            }
          `}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{text}</p>
          {children}
        </div>

        {/* Timestamp */}
        <p className={`text-[10px] text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(timestamp)}
        </p>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-4 h-4 text-gray-600" />
        </div>
      )}
    </div>
  );
}
