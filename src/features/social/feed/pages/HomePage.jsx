import { Users } from "lucide-react";

import EmptyState from "../../../../components/common/EmptyState";
import Button from "../../../../components/ui/Button";
import { useAuthStore } from "../../../../stores/authStore";
import FeedHeader from "../components/FeedHeader";
import PostCard from "../components/PostCard";
import PostComposer from "../components/PostComposer";
import StoryRail from "../components/StoryRail";
import { useFeed } from "../hooks/useFeed";

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const feed = useFeed(user);

  return (
    <div className="space-y-4">
      <FeedHeader
        audience={feed.audience}
        onAudienceChange={feed.setAudience}
      />

      <StoryRail user={user} />
      <PostComposer user={user} onSubmit={feed.addPost} />

      {feed.posts.length > 0 ? (
        <ul className="space-y-4">
          {feed.posts.map((post) => (
            <li key={post.id}>
              <PostCard
                post={post}
                currentUser={user}
                onToggleLike={feed.toggleLike}
                onToggleSave={feed.toggleSave}
                onAddComment={feed.addComment}
                onRemove={feed.removePost}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Users}
          title="Nothing to show yet"
          description="Posts from people you follow will appear here."
          className="rounded-2xl border border-line bg-surface"
          action={
            <Button
              variant="secondary"
              onClick={() => feed.setAudience("everyone")}
            >
              See everyone's posts
            </Button>
          }
        />
      )}
    </div>
  );
}
