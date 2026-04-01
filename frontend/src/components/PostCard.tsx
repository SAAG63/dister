import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import type { Post } from '../mocks/data';
import ReactionBar from './ReactionBar';

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
}

export default function PostCard({ post, compact }: PostCardProps) {
  return (
    <article className="group p-5 border-b border-border hover:bg-surface-elevated/50 transition-colors duration-150">
      <div className="flex gap-3">
        <Link to={`/profile/${post.author.id}`} className="shrink-0">
          <div className="w-10 h-10 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-sm font-semibold text-accent uppercase">
            {post.author.username.charAt(0)}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/profile/${post.author.id}`}
              className="font-semibold text-sm text-text-primary hover:text-accent transition-colors"
            >
              {post.author.username}
            </Link>
            <span className="text-text-muted text-xs">·</span>
            <span className="text-text-muted text-xs">{timeAgo(post.createdAt)}</span>
          </div>

          <Link to={`/post/${post.id}`} className="block">
            <p className="text-text-primary text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {post.content}
            </p>
          </Link>

          {!compact && (
            <div className="flex items-center gap-4 mt-3">
              <ReactionBar reactions={post.reactions} />
              <Link
                to={`/post/${post.id}`}
                className="flex items-center gap-1.5 text-text-muted hover:text-accent text-xs transition-colors"
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
