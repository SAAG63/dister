import { useState } from 'react';
import { posts as mockPosts } from '../mocks/data';
import type { Post } from '../mocks/data';
import PostCard from '../components/PostCard';
import PostForm from '../components/PostForm';
import { useAuthStore } from '../store/auth';

export default function FeedPage() {
  const [feed, setFeed] = useState<Post[]>(mockPosts);
  const user = useAuthStore((s) => s.user);

  const handleNewPost = (content: string) => {
    if (!user) return;
    const newPost: Post = {
      id: String(Date.now()),
      author: user,
      content,
      parentId: null,
      createdAt: new Date().toISOString(),
      reactions: [],
      replyCount: 0,
    };
    setFeed([newPost, ...feed]);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-bg/80 border-b border-border px-5 py-4">
        <h1 className="font-display font-bold text-lg text-text-primary">Лента</h1>
      </div>

      <PostForm onSubmit={handleNewPost} />

      <div>
        {feed.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
