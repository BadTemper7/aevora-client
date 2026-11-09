import { Plus } from "lucide-react";
import { useState } from "react";

import Avatar from "../../../../components/ui/Avatar";
import { cn } from "../../../../utils/cn";
import { stories as initialStories } from "../data/mock";

/** Gradient ring = unseen story, quiet ring = seen. */
function StoryRing({ seen, children }) {
  return (
    <span
      className={cn(
        "grid size-[68px] place-items-center rounded-full p-[3px]",
        seen
          ? "bg-line-strong"
          : "bg-gradient-to-tr from-[#3f68f5] via-[#7c4df0] to-[#c04bd8]",
      )}
    >
      <span className="grid size-full place-items-center rounded-full bg-surface p-[2px]">
        {children}
      </span>
    </span>
  );
}

export default function StoryRail({ user }) {
  const [stories, setStories] = useState(initialStories);

  const markSeen = (id) =>
    setStories((current) =>
      current.map((s) => (s.id === id ? { ...s, seen: true } : s)),
    );

  return (
    <section
      aria-label="Stories"
      className="rounded-2xl border border-line bg-surface px-4 pb-3 pt-4"
    >
      <ul className="no-scrollbar -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-1">
        <li className="snap-start">
          <button
            type="button"
            className="group flex w-[76px] flex-col items-center gap-2"
          >
            <span className="relative">
              <Avatar
                name={user?.name}
                size="lg"
                className="size-[68px] text-2xl"
              />
              <span className="absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full border-2 border-surface bg-brand text-on-brand">
                <Plus className="size-3.5" aria-hidden="true" />
              </span>
            </span>
            <span className="w-full truncate text-center text-xs font-medium text-ink">
              Add story
            </span>
          </button>
        </li>

        {stories.map((story) => (
          <li key={story.id} className="snap-start">
            <button
              type="button"
              onClick={() => markSeen(story.id)}
              aria-label={`${story.name}'s story${story.seen ? "" : ", new"}`}
              className="flex w-[76px] flex-col items-center gap-2"
            >
              <StoryRing seen={story.seen}>
                <Avatar
                  name={story.name}
                  size="lg"
                  className="size-full text-xl"
                />
              </StoryRing>
              <span
                className={cn(
                  "w-full truncate text-center text-xs",
                  story.seen ? "text-ink-soft" : "font-medium text-ink",
                )}
              >
                {story.name.split(" ")[0]}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
