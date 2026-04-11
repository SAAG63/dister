interface ReactionView {
  emoji: string;
  count: number;
  reacted: boolean;
}

export function transformReactions(
  reactionCounts: Record<string, number> | any,
  myReactions?: { targetId: string; emoji: string }[],
  targetId?: string,
): ReactionView[] {
  const counts = (reactionCounts ?? {}) as Record<string, number>;
  const myEmojis = new Set(
    (myReactions ?? [])
      .filter((r) => r.targetId === targetId)
      .map((r) => r.emoji),
  );

  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([emoji, count]) => ({
      emoji,
      count,
      reacted: myEmojis.has(emoji),
    }));
}

export function transformPost(
  post: any,
  myReactions?: { targetId: string; emoji: string }[],
) {
  const { reactionCounts, ...rest } = post;
  return {
    ...rest,
    reactions: transformReactions(reactionCounts, myReactions, post.id),
  };
}

export function transformMessage(
  message: any,
  myReactions?: { targetId: string; emoji: string }[],
) {
  const { reactionCounts, ...rest } = message;
  return {
    ...rest,
    reactions: transformReactions(reactionCounts, myReactions, message.id),
  };
}
