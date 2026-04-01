import { useState } from 'react';
import { Send } from 'lucide-react';

interface PostFormProps {
  onSubmit: (content: string) => void;
  placeholder?: string;
  buttonText?: string;
}

export default function PostForm({
  onSubmit,
  placeholder = 'Что нового?',
  buttonText = 'Опубликовать',
}: PostFormProps) {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 border-b border-border">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-transparent text-text-primary text-[15px] placeholder:text-text-muted resize-none outline-none leading-relaxed"
      />
      <div className="flex justify-end mt-3">
        <button
          type="submit"
          disabled={!content.trim()}
          className="flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-bg text-sm font-semibold rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
          {buttonText}
        </button>
      </div>
    </form>
  );
}
