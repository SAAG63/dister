import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { posts, threadReplies as mockReplies } from '../mocks/data';
import type { Post } from '../mocks/data';
import PostCard from '../components/PostCard';
import PostForm from '../components/PostForm';
import { useAuthStore } from '../store/auth';

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const post = posts.find((p) => p.id === id);
  const user = useAuthStore((s) => s.user);

  const [replies, setReplies] = useState<Post[]>(
    mockReplies.filter((r) => r.parentId === id),
  );

  if (!post) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-muted">Пост не найден</p>
      </div>
    );
  }

  const handleReply = (content: string) => {
    if (!user) return;
    const newReply: Post = {
      id: String(Date.now()),
      author: user,
      content,
      parentId: post.id,
      createdAt: new Date().toISOString(),
      reactions: [],
      replyCount: 0,
    };
    setReplies([...replies, newReply]);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-bg/80 border-b border-border px-5 py-4 flex items-center gap-3">
        <Link
          to="/feed"
          className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display font-bold text-lg text-text-primary">Пост</h1>
      </div>

      <PostCard post={post} />

      <PostForm
        onSubmit={handleReply}
        placeholder="Написать ответ..."
        buttonText="Ответить"
      />

      {replies.length > 0 && (
        <div className="border-l-2 border-border ml-8">
          {replies.map((reply) => (
            <PostCard key={reply.id} post={reply} compact />
          ))}
        </div>
      )}
    </div>
  );
}
