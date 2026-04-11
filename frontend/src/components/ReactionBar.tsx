import { useState, useEffect, useRef } from 'react';
import { SmilePlus } from 'lucide-react';
import type { Reaction } from '../types';

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '😂', '😢', '🎉', '🤔', '👀'];

interface ReactionBarProps {
  reactions: Reaction[];
  onAdd?: (emoji: string) => Promise<void>;
  onRemove?: (emoji: string) => Promise<void>;
}

export default function ReactionBar({ reactions: propReactions, onAdd, onRemove }: ReactionBarProps) {
  const [reactions, setReactions] = useState(propReactions);
  const [showPicker, setShowPicker] = useState(false);
  const prevRef = useRef(propReactions);

  useEffect(() => {
    if (prevRef.current !== propReactions) {
      setReactions(propReactions);
      prevRef.current = propReactions;
    }
  }, [propReactions]);

  const toggle = async (emoji: string) => {
    const existing = reactions.find((r) => r.emoji === emoji);
    const wasReacted = existing?.reacted ?? false;

    if (existing) {
      if (wasReacted) {
        setReactions((prev) =>
          prev.map((r) => r.emoji === emoji ? { ...r, reacted: false, count: r.count - 1 } : r)
            .filter((r) => r.count > 0),
        );
      } else {
        setReactions((prev) =>
          prev.map((r) => r.emoji === emoji ? { ...r, reacted: true, count: r.count + 1 } : r),
        );
      }
    } else {
      setReactions((prev) => [...prev, { emoji, count: 1, reacted: true }]);
    }
    setShowPicker(false);

    try {
      if (wasReacted) {
        await onRemove?.(emoji);
      } else {
        await onAdd?.(emoji);
      }
    } catch {
      setReactions((prev) => {
        if (wasReacted) {
          const ex = prev.find((r) => r.emoji === emoji);
          if (ex) return prev.map((r) => r.emoji === emoji ? { ...r, reacted: true, count: r.count + 1 } : r);
          return [...prev, { emoji, count: 1, reacted: true }];
        } else {
          if (existing) {
            return prev.map((r) => r.emoji === emoji ? { ...r, reacted: false, count: r.count - 1 } : r)
              .filter((r) => r.count > 0);
          }
          return prev.filter((r) => r.emoji !== emoji);
        }
      });
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap relative">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => toggle(r.emoji)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold transition-all border-2 border-border ${
            r.reacted
              ? 'bg-accent shadow-[2px_2px_0_0] shadow-border'
              : 'bg-surface hover:bg-surface-elevated'
          }`}
        >
          <span>{r.emoji}</span>
          <span>{r.count}</span>
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex items-center justify-center w-7 h-7 text-text-muted hover:text-secondary border-2 border-border bg-surface hover:bg-surface-elevated transition-all"
        >
          <SmilePlus className="w-3.5 h-3.5" />
        </button>
        {showPicker && (
          <div className="absolute bottom-full left-0 mb-1 bg-surface border-3 border-border shadow-[4px_4px_0_0] shadow-border p-2 flex gap-1 z-20">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => toggle(emoji)}
                className="w-8 h-8 flex items-center justify-center hover:bg-accent transition-colors text-base"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
