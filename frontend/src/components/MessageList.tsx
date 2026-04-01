import { useEffect, useRef } from 'react';
import type { Message } from '../mocks/data';
import ReactionBar from './ReactionBar';

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {messages.map((msg) => (
        <div key={msg.id} className="group flex gap-3 hover:bg-surface-elevated/30 rounded-lg p-2 -m-2 transition-colors">
          <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-xs font-semibold text-accent uppercase shrink-0">
            {msg.author.username.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-text-primary">
                {msg.author.username}
              </span>
              <span className="text-xs text-text-muted">{formatTime(msg.createdAt)}</span>
            </div>
            <p className="text-[15px] text-text-primary/90 leading-relaxed mt-0.5 break-words">
              {msg.content}
            </p>
            {msg.reactions.length > 0 && (
              <div className="mt-1.5">
                <ReactionBar reactions={msg.reactions} />
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
