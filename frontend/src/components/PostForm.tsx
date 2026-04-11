import { useState } from 'react';
import { Send } from 'lucide-react';

interface PostFormProps {
  onSubmit: (content: string) => Promise<void> | void;
  placeholder?: string;
  buttonText?: string;
}

export default function PostForm({
  onSubmit,
  placeholder = 'Что нового?',
  buttonText = 'Опубликовать',
}: PostFormProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      await onSubmit(content.trim());
      setContent('');
    } catch {
      setError('Не удалось опубликовать');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 border-b-3 border-border">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-surface border-3 border-border px-4 py-3 text-text-primary text-[15px] placeholder:text-text-muted resize-none outline-none leading-relaxed focus:shadow-[3px_3px_0_0] focus:shadow-accent transition-shadow"
      />
      {error && (
        <p className="text-danger text-xs font-semibold mt-1">{error}</p>
      )}
      <div className="flex justify-end mt-3">
        <button
          type="submit"
          disabled={!content.trim() || loading}
          className="flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent-hover border-3 border-border shadow-[3px_3px_0_0] shadow-border hover:shadow-[1px_1px_0_0] hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-40 disabled:cursor-not-allowed text-border text-sm font-bold transition-all active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
        >
          <Send className="w-4 h-4" />
          {loading ? 'Отправка...' : buttonText}
        </button>
      </div>
    </form>
  );
}
