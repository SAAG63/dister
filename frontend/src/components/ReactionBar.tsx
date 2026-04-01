import { useState } from 'react';
import type { Reaction } from '../mocks/data';

interface ReactionBarProps {
  reactions: Reaction[];
}

export default function ReactionBar({ reactions: initial }: ReactionBarProps) {
  const [reactions, setReactions] = useState(initial);

  const toggle = (emoji: string) => {
    setReactions((prev) =>
      prev.map((r) =>
        r.emoji === emoji
          ? { ...r, reacted: !r.reacted, count: r.reacted ? r.count - 1 : r.count + 1 }
          : r,
      ),
    );
  };

  if (reactions.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => toggle(r.emoji)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all duration-150 border ${
            r.reacted
              ? 'border-accent/40 bg-accent-subtle text-accent'
              : 'border-border bg-surface-elevated text-text-secondary hover:border-border-light'
          }`}
        >
          <span>{r.emoji}</span>
          <span className="font-medium">{r.count}</span>
        </button>
      ))}
    </div>
  );
}
