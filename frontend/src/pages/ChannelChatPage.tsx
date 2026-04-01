import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Hash, Users, LogOut } from 'lucide-react';
import { channels, messages as mockMessages } from '../mocks/data';
import type { Message } from '../mocks/data';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import { useAuthStore } from '../store/auth';

export default function ChannelChatPage() {
  const { id } = useParams<{ id: string }>();
  const channel = channels.find((c) => c.id === id);
  const user = useAuthStore((s) => s.user);
  const [msgs, setMsgs] = useState<Message[]>(mockMessages);
  const [joined, setJoined] = useState(true);

  if (!channel) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-muted">Канал не найден</p>
      </div>
    );
  }

  const handleSend = (content: string) => {
    if (!user) return;
    const newMsg: Message = {
      id: String(Date.now()),
      author: user,
      content,
      createdAt: new Date().toISOString(),
      reactions: [],
    };
    setMsgs([...msgs, newMsg]);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-surface px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/channels"
            className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Hash className="w-5 h-5 text-text-muted" />
          <div>
            <h1 className="font-display font-bold text-base text-text-primary">
              {channel.name}
            </h1>
            <p className="text-xs text-text-muted">{channel.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <Users className="w-3.5 h-3.5" />
            {channel.memberCount}
          </span>
          <button
            onClick={() => setJoined(!joined)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              joined
                ? 'border-border text-text-secondary hover:border-danger hover:text-danger'
                : 'border-accent bg-accent-subtle text-accent hover:bg-accent hover:text-bg'
            }`}
          >
            {joined ? (
              <>
                <LogOut className="w-3.5 h-3.5" />
                Выйти
              </>
            ) : (
              'Вступить'
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={msgs} />

      {/* Input */}
      {joined && <MessageInput onSend={handleSend} />}
    </div>
  );
}
