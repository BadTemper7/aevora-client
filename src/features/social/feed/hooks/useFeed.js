import { useCallback, useMemo, useState } from "react";

import { initialPosts } from "../data/mock";

const update = (posts, id, change) =>
  posts.map((post) => (post.id === id ? { ...post, ...change(post) } : post));

/**
 * All feed state and actions in one place.
 * Swap the local state for react-query + API calls when the backend exists;
 * the components only talk to this hook.
 */
export function useFeed(currentUser) {
  const [posts, setPosts] = useState(initialPosts);
  const [audience, setAudience] = useState("everyone"); // "everyone" | "following"

  const visiblePosts = useMemo(
    () =>
      audience === "following"
        ? posts.filter((post) => post.fromFollowing)
        : posts,
    [posts, audience],
  );

  const addPost = useCallback(
    ({ content, images }) => {
      const post = {
        id: crypto.randomUUID(),
        author: { name: currentUser.name, username: currentUser.username },
        content,
        images,
        createdAt: new Date().toISOString(),
        likes: 0,
        liked: false,
        saved: false,
        commentCount: 0,
        comments: [],
        fromFollowing: true,
        own: true,
      };
      setPosts((current) => [post, ...current]);
    },
    [currentUser],
  );

  const toggleLike = useCallback((id) => {
    setPosts((current) =>
      update(current, id, (post) => ({
        liked: !post.liked,
        likes: post.likes + (post.liked ? -1 : 1),
      })),
    );
  }, []);

  const toggleSave = useCallback((id) => {
    setPosts((current) =>
      update(current, id, (post) => ({ saved: !post.saved })),
    );
  }, []);

  const addComment = useCallback(
    (id, text) => {
      const comment = {
        id: crypto.randomUUID(),
        author: { name: currentUser.name, username: currentUser.username },
        text,
        createdAt: new Date().toISOString(),
      };
      setPosts((current) =>
        update(current, id, (post) => ({
          comments: [...post.comments, comment],
          commentCount: post.commentCount + 1,
        })),
      );
    },
    [currentUser],
  );

  const removePost = useCallback((id) => {
    setPosts((current) => current.filter((post) => post.id !== id));
  }, []);

  return {
    posts: visiblePosts,
    audience,
    setAudience,
    addPost,
    toggleLike,
    toggleSave,
    addComment,
    removePost,
  };
}
