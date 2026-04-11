import { useState, useEffect, useCallback } from 'react';
import PostCard from '../components/PostCard';
import PostForm from '../components/PostForm';
import { useAuthStore } from '../store/auth';
import { getFeed, createPost } from '../api/posts';

interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface Post {
  id: string;
  author: { id: string; username: string; avatarUrl: string | null; createdAt: string };
  content: string;
  parentId: string | null;
  createdAt: string;
  reactions: Reaction[];
  replyCount: number;
}

export default function FeedPage() {
  const [feed, setFeed] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const user = useAuthStore((s) => s.user);

  const loadFeed = useCallback(() => {
    getFeed().then((res) => {
      setFeed(res.data);
      setCursor(res.nextCursor);
      setHasMore(res.hasMore);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    const onFocus = () => loadFeed();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadFeed]);

  const handleLoadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    const res = await getFeed(cursor);
    setFeed((prev) => [...prev, ...res.data]);
    setCursor(res.nextCursor);
    setHasMore(res.hasMore);
    setLoadingMore(false);
  };

  const handleNewPost = async (content: string) => {
    if (!user) return;
    const post = await createPost(content);
    setFeed((prev) => [post, ...prev]);
  };

  const handleDeleted = (postId: string) => {
    setFeed((prev) => prev.filter((p) => p.id !== postId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted font-bold">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 bg-bg border-b-3 border-border px-5 py-4">
        <h1 className="font-display font-extrabold text-lg text-text-primary">Лента</h1>
      </div>

      <PostForm onSubmit={handleNewPost} />

      <div>
        {feed.map((post) => (
          <PostCard key={post.id} post={post} onDeleted={handleDeleted} />
        ))}
        {feed.length === 0 && (
          <div className="p-8 text-center text-text-muted font-semibold">
            Лента пуста. Подпишитесь на кого-нибудь или напишите первый пост!
          </div>
        )}
        {hasMore && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full py-3 text-sm font-bold text-text-muted hover:bg-surface-elevated border-b-3 border-border transition-colors"
          >
            {loadingMore ? 'Загрузка...' : 'Загрузить ещё'}
          </button>
        )}
      </div>
    </div>
  );
}
