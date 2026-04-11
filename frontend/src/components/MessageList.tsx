import { useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import type { Message } from '../types';
import ReactionBar from './ReactionBar';
import { useAuthStore } from '../store/auth';
import { addMessageReaction, removeMessageReaction, deleteMessage } from '../api/messages';

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface MessageListProps {
  messages: Message[];
  channelId: string;
  userRole?: string | null;
  onDeleted?: (msgId: string) => void;
}

export default function MessageList({ messages, channelId, userRole, onDeleted }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {messages.map((msg) => {
        const isOwn = msg.author.id === currentUser?.id;
        const canDelete = isOwn || userRole === 'OWNER' || userRole === 'MODERATOR';

        const handleDeleteMsg = async () => {
          if (!confirm('Удалить сообщение?')) return;
          try {
            await deleteMessage(channelId, msg.id);
            onDeleted?.(msg.id);
          } catch {}
        };

        return (
          <div
            key={msg.id}
            className={`group flex gap-3 items-end ${isOwn ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full border-2 border-border flex items-center justify-center text-xs font-bold uppercase shrink-0 ${
              isOwn ? 'bg-accent' : 'bg-secondary text-white'
            }`}>
              {msg.author.username.charAt(0)}
            </div>
            <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
              <div className={`text-[10px] font-bold mb-1 flex items-center gap-1 ${isOwn ? 'mr-1 justify-end' : 'ml-1'}`}>
                {msg.author.username}
                {canDelete && (
                  <button onClick={handleDeleteMsg} className="text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className={`border-3 border-border px-4 py-2.5 text-[15px] leading-relaxed ${
                isOwn
                  ? 'bg-accent shadow-[3px_3px_0_0] shadow-border'
                  : 'bg-surface shadow-[3px_3px_0_0] shadow-border'
              }`}>
                <p className="break-words">{msg.content}</p>
                <span className="text-[10px] text-text-muted mt-1 block">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
              <div className="mt-1.5">
                <ReactionBar
                  reactions={msg.reactions}
                  onAdd={(emoji) => addMessageReaction(channelId, msg.id, emoji)}
                  onRemove={(emoji) => removeMessageReaction(channelId, msg.id, emoji)}
                />
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
