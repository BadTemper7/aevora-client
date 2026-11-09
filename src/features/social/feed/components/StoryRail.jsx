import { ChevronLeft, ChevronRight, Loader2, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import Avatar from "../../../../components/ui/Avatar";
import Button from "../../../../components/ui/Button";
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
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Instagram-style preview state
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [stories]);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;

    scrollRef.current.scrollBy({
      left: direction === "left" ? -clientWidth : clientWidth,
      behavior: "smooth",
    });
  };

  const markSeen = (id) =>
    setStories((current) =>
      current.map((s) => (s.id === id ? { ...s, seen: true } : s)),
    );

  // 1. User selects a file -> open preview modal
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be selected again
    event.target.value = "";

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // 2. User clicks "Share to story" -> simulate upload & add story
  const handleShareStory = () => {
    if (!previewUrl) return;

    setIsUploading(true);

    // Simulate a network upload delay
    setTimeout(() => {
      const newStory = {
        id: crypto.randomUUID(),
        name: user?.name || "You",
        seen: true, // Your own story is technically "seen"
        image: previewUrl, // Transfer the blob URL to the story
      };

      setStories((current) => [newStory, ...current]);

      // Cleanup state
      setIsUploading(false);
      setPreviewUrl(null);
    }, 800); // 800ms fake delay
  };

  // 3. User cancels preview
  const handleCancelPreview = () => {
    if (isUploading) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  return (
    <>
      <section
        aria-label="Stories"
        className="rounded-2xl border border-line bg-surface px-4 pb-3 pt-4"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Hidden File Input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* FIXED: Add Story Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group flex w-[76px] shrink-0 flex-col items-center gap-2"
          >
            <span className="relative">
              <Avatar
                name={user?.name}
                size="lg"
                className="size-[68px] text-2xl"
              />
              <span className="absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full border-2 border-surface bg-brand text-on-brand transition-transform group-hover:scale-110">
                <Plus className="size-3.5" aria-hidden="true" />
              </span>
            </span>
            <span className="w-full truncate text-center text-xs font-medium text-ink">
              Add story
            </span>
          </button>

          {/* SCROLLABLE AREA */}
          <div className="relative flex-1 min-w-0">
            {/* Left Scroll Button & Gradient */}
            <div
              className={cn(
                "pointer-events-none absolute inset-y-0 left-0 z-10 flex w-16 items-center transition-opacity duration-200",
                canScrollLeft ? "opacity-100" : "opacity-0",
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/80 to-transparent" />
              <button
                type="button"
                onClick={() => scroll("left")}
                aria-label="Scroll left"
                className={cn(
                  "pointer-events-auto relative ml-1 grid size-8 place-items-center rounded-full border border-line bg-surface text-ink-soft shadow-sm transition-colors hover:bg-raised hover:text-ink",
                  !canScrollLeft && "hidden",
                )}
              >
                <ChevronLeft className="size-5" />
              </button>
            </div>

            {/* Right Scroll Button & Gradient */}
            <div
              className={cn(
                "pointer-events-none absolute inset-y-0 right-0 z-10 flex w-16 items-center justify-end transition-opacity duration-200",
                canScrollRight ? "opacity-100" : "opacity-0",
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-l from-surface via-surface/80 to-transparent" />
              <button
                type="button"
                onClick={() => scroll("right")}
                aria-label="Scroll right"
                className={cn(
                  "pointer-events-auto relative mr-1 grid size-8 place-items-center rounded-full border border-line bg-surface text-ink-soft shadow-sm transition-colors hover:bg-raised hover:text-ink",
                  !canScrollRight && "hidden",
                )}
              >
                <ChevronRight className="size-5" />
              </button>
            </div>

            {/* Scrollable UL */}
            <ul
              ref={scrollRef}
              onScroll={checkScroll}
              className="no-scrollbar flex snap-x gap-3 overflow-x-auto py-1 sm:gap-4"
            >
              {stories.map((story) => (
                <li key={story.id} className="snap-start">
                  <button
                    type="button"
                    onClick={() => markSeen(story.id)}
                    aria-label={`${story.name}'s story${story.seen ? "" : ", new"}`}
                    className="flex w-[76px] flex-col items-center gap-2"
                  >
                    <StoryRing seen={story.seen}>
                      {story.image ? (
                        <img
                          src={story.image}
                          alt={`${story.name}'s story`}
                          className="size-full rounded-full object-cover"
                        />
                      ) : (
                        <Avatar
                          name={story.name}
                          size="lg"
                          className="size-full text-xl"
                        />
                      )}
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
          </div>
        </div>
      </section>

      {/* INSTAGRAM-STYLE PREVIEW MODAL */}
      {previewUrl &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={handleCancelPreview}
                disabled={isUploading}
                className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-50"
              >
                <X className="size-6" />
              </button>
              <h2 className="text-sm font-semibold text-white sm:text-base">
                Story Preview
              </h2>
              <div className="size-10" /> {/* Spacer for centering */}
            </div>

            {/* Image Preview Area */}
            <div className="flex-1 overflow-hidden p-4 sm:p-8">
              <div className="flex size-full items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Story preview"
                  className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
                />
              </div>
            </div>

            {/* Footer / Share Button */}
            <div className="flex items-center justify-center px-4 pb-8 pt-4 sm:px-6">
              <Button
                onClick={handleShareStory}
                disabled={isUploading}
                size="lg"
                className="w-full max-w-xs rounded-full bg-brand text-base font-semibold text-white hover:bg-brand-hover"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  "Share to story"
                )}
              </Button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
