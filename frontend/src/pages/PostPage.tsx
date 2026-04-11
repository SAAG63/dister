import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PostCard from '../components/PostCard';
import PostForm from '../components/PostForm';
import { useAuthStore } from '../store/auth';
import { getPost, getThread, createPost } from '../api/posts';

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

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getPost(id), getThread(id)])
      .then(([postData, threadData]) => {
        setPost(postData);
        setReplies(threadData.data);
        setCursor(threadData.nextCursor);
        setHasMore(threadData.hasMore);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted font-bold">Загрузка...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-muted font-bold">Пост не найден</p>
      </div>
    );
  }

  const handleReply = async (content: string) => {
    if (!user) return;
    const newReply = await createPost(content, post.id);
    setReplies((prev) => [...prev, newReply]);
    setPost({ ...post, replyCount: post.replyCount + 1 });
  };

  const handlePostDeleted = () => {
    navigate('/feed');
  };

  const handleReplyDeleted = (replyId: string) => {
    setReplies((prev) => prev.filter((r) => r.id !== replyId));
  };

  const handleLoadMore = async () => {
    if (!id || !cursor) return;
    const res = await getThread(id, cursor);
    setReplies((prev) => [...prev, ...res.data]);
    setCursor(res.nextCursor);
    setHasMore(res.hasMore);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 bg-bg border-b-3 border-border px-5 py-4 flex items-center gap-3">
        <Link
          to="/feed"
          className="p-1.5 border-2 border-border hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display font-extrabold text-lg text-text-primary">Пост</h1>
      </div>

      <PostCard post={post} onDeleted={handlePostDeleted} />

      {replies.length > 0 && (
        <div className="border-l-4 border-secondary ml-8">
          {replies.map((reply) => (
            <PostCard key={reply.id} post={reply} compact onDeleted={handleReplyDeleted} />
          ))}
          {hasMore && (
            <button
              onClick={handleLoadMore}
              className="w-full py-3 text-sm font-bold text-text-muted hover:bg-surface-elevated border-b-3 border-border transition-colors"
            >
              Загрузить ещё
            </button>
          )}
        </div>
      )}

      <PostForm
        onSubmit={handleReply}
        placeholder="Написать ответ..."
        buttonText="Ответить"
      />
    </div>
  );
}
