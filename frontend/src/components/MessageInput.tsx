import { useState } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string) => void;
  placeholder?: string;
}

export default function MessageInput({ onSend, placeholder = 'Написать сообщение...' }: MessageInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSend(value.trim());
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t-3 border-border bg-bg">
      <div className="flex items-center gap-3 bg-surface border-3 border-border px-4 py-2 focus-within:shadow-[3px_3px_0_0] focus-within:shadow-accent transition-shadow">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="p-2 bg-accent border-2 border-border shadow-[2px_2px_0_0] shadow-border hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-4 h-4 text-border" />
        </button>
      </div>
    </form>
  );
}
