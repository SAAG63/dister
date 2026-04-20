import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Trash2 } from 'lucide-react';
import type { Post } from '../types';
import ReactionBar from './ReactionBar';
import { addReaction, removeReaction, deletePost } from '../api/posts';
import { useAuthStore } from '../store/auth';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes}м`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}ч`;
  const days = Math.floor(hours / 24);
  return `${days}д`;
}

interface PostCardProps {
  post: Post;
  compact?: boolean;
  onDeleted?: (postId: string) => void;
}

export default function PostCard({ post, compact, onDeleted }: PostCardProps) {
  const currentUser = useAuthStore((s) => s.user);
  const isOwn = currentUser?.id === post.author.id;
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Удалить пост?')) return;
    setDeleting(true);
    try {
      await deletePost(post.id);
      onDeleted?.(post.id);
    } catch {
      setDeleting(false);
    }
  };
  return (
    <article className="group p-5 border-b-3 border-border hover:bg-surface-elevated/50 transition-colors duration-150">
      <div className="flex gap-3">
        <Link to={`/profile/${post.author.id}`} className="shrink-0">
          {post.author.avatarUrl ? (
            <img src={post.author.avatarUrl} alt="" className="w-10 h-10 rounded-full border-2 border-border object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-accent border-2 border-border flex items-center justify-center text-sm font-bold text-border uppercase">
              {post.author.username.charAt(0)}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/profile/${post.author.id}`}
              className="font-bold text-sm text-text-primary hover:text-secondary transition-colors"
            >
              {post.author.username}
            </Link>
            <span className="text-text-muted text-xs font-bold">·</span>
            <span className="text-text-muted text-xs">{timeAgo(post.createdAt)}</span>
            {isOwn && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="ml-auto text-text-muted hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Link to={`/post/${post.id}`} className="block">
            <p className="text-text-primary text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {post.content}
            </p>
          </Link>

          {!compact && (
            <div className="flex items-center gap-4 mt-3">
              <ReactionBar
                reactions={post.reactions}
                onAdd={(emoji) => addReaction(post.id, emoji)}
                onRemove={(emoji) => removeReaction(post.id, emoji)}
              />
              <Link
                to={`/post/${post.id}`}
                className="flex items-center gap-1.5 text-text-muted hover:text-secondary text-xs font-semibold transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                {post.replyCount > 0 && <span>{post.replyCount}</span>}
              </Link>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
