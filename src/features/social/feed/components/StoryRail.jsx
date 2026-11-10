import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Pause,
  Trash2,
  Users,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Avatar from "../../../../components/ui/Avatar";
import { cn } from "../../../../utils/cn";
import { mediaFile } from "../../api/socialApi";

const IMAGE_DURATION = 5000; // ms an image stays on screen
const HOLD_MS = 200; // press longer than this = hold-to-pause, not a tap

const VISIBILITY = {
  public: { label: "Everyone", Icon: Globe },
  friends: { label: "Friends", Icon: Users },
  followers: { label: "Followers", Icon: Users },
};

function timeAgo(date) {
  if (!date) return "";
  const mins = Math.max(0, Math.floor((Date.now() - new Date(date)) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return hrs < 24 ? `${hrs}h` : `${Math.floor(hrs / 24)}d`;
}

function timeLeft(date) {
  if (!date) return "";
  const mins = Math.max(0, Math.floor((new Date(date) - Date.now()) / 60000));
  if (mins < 60) return `${mins}m left`;
  return `${Math.floor(mins / 60)}h left`;
}

export default function StoryViewer({
  stories,
  index,
  user,
  busy,
  error,
  onChange, // (nextIndex) => void
  onClose, // () => void
  onDelete, // (story) => void
  onView, // (story) => void  - mark as viewed
}) {
  const story = stories[index];
  const isVideo = story?.mediaKind === "video";
  const isOwner = story?.ownerId === user?.id;

  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const videoRef = useRef(null);
  const elapsed = useRef(0);
  const pressStart = useRef(0);
  const closeRef = useRef(null);

  const next = useCallback(() => {
    if (index < stories.length - 1) onChange(index + 1);
    else onClose();
  }, [index, stories.length, onChange, onClose]);

  const prev = useCallback(() => {
    if (index > 0) {
      onChange(index - 1);
      return;
    }
    // first story: restart it
    elapsed.current = 0;
    setProgress(0);
    if (videoRef.current) videoRef.current.currentTime = 0;
  }, [index, onChange]);

  // Always call the latest next() from timers without re-subscribing them.
  const nextRef = useRef(next);
  nextRef.current = next;

  // Reset + mark viewed whenever the story changes.
  useEffect(() => {
    if (!story) return;
    elapsed.current = 0;
    setProgress(0);
    setPaused(false);
    onView?.(story);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  // Auto-advance timer for photos.
  useEffect(() => {
    if (!story || isVideo || paused) return undefined;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      elapsed.current += now - last;
      last = now;
      const p = Math.min(elapsed.current / IMAGE_DURATION, 1);
      setProgress(p);
      if (p >= 1) {
        nextRef.current();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [story?.id, isVideo, paused]);

  // Pause / resume video together with the hold gesture.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [paused, story?.id]);

  // Keyboard, focus and scroll lock.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [next, prev, onClose]);

  if (!story) return null;

  const author = story.author?.name || "User";
  const vis = VISIBILITY[story.visibility];
  const poster = mediaFile(story.mediaId, true);
  const backdrop = isVideo ? poster : mediaFile(story.mediaId);

  const onPointerDown = () => {
    pressStart.current = Date.now();
    setPaused(true);
  };
  const onPointerUp = (e) => {
    setPaused(false);
    if (Date.now() - pressStart.current > HOLD_MS) return; // it was a hold
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.3) prev();
    else next();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${author}'s story`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black text-white"
    >
      {/* Blurred ambient backdrop */}
      <img
        src={backdrop}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full scale-125 object-cover opacity-40 blur-3xl"
      />
      <div className="absolute inset-0 bg-black/50" />

      {/* Desktop close */}
      <button
        ref={closeRef}
        type="button"
        aria-label="Close story"
        onClick={onClose}
        className="absolute right-5 top-5 z-30 hidden size-11 place-items-center rounded-full bg-white/10 backdrop-blur transition hover:bg-white/20 sm:grid"
      >
        <X size={22} />
      </button>

      {/* Desktop prev / next */}
      {index > 0 && (
        <button
          type="button"
          aria-label="Previous story"
          onClick={prev}
          className="absolute left-[max(1rem,calc(50%-19rem))] z-30 hidden size-11 place-items-center rounded-full bg-white/10 backdrop-blur transition hover:bg-white/20 sm:grid"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      {index < stories.length - 1 && (
        <button
          type="button"
          aria-label="Next story"
          onClick={next}
          className="absolute right-[max(1rem,calc(50%-19rem))] z-30 hidden size-11 place-items-center rounded-full bg-white/10 backdrop-blur transition hover:bg-white/20 sm:grid"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Story card: full-bleed on phones, 9:16 card on larger screens */}
      <div className="relative h-full w-full overflow-hidden bg-neutral-950 sm:h-[min(92vh,880px)] sm:w-auto sm:aspect-[9/16] sm:rounded-3xl sm:shadow-2xl sm:ring-1 sm:ring-white/10">
        {/* Blurred fill so landscape media doesn't leave flat bars */}
        <img
          src={backdrop}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full scale-125 object-cover opacity-60 blur-2xl"
        />

        {/* Media */}
        {isVideo ? (
          <video
            ref={videoRef}
            key={story.id}
            src={mediaFile(story.mediaId)}
            poster={poster}
            autoPlay
            playsInline
            muted={muted}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration) setProgress(v.currentTime / v.duration);
            }}
            onEnded={() => nextRef.current()}
            className="absolute inset-0 size-full object-contain"
          />
        ) : (
          <img
            key={story.id}
            src={mediaFile(story.mediaId)}
            alt={`Story by ${author}`}
            draggable={false}
            className="absolute inset-0 size-full object-contain"
          />
        )}

        {/* Tap / hold surface */}
        <div
          className="absolute inset-0 z-10 touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerLeave={() => setPaused(false)}
          onPointerCancel={() => setPaused(false)}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Top scrim + progress + header */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/70 via-black/30 to-transparent px-3 pb-10 pt-3">
          <div
            className="flex gap-1"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={stories.length}
            aria-valuenow={index + 1}
            aria-label={`Story ${index + 1} of ${stories.length}`}
          >
            {stories.map((s, i) => (
              <span
                key={s.id}
                className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30"
              >
                <span
                  className="block h-full origin-left rounded-full bg-white"
                  style={{
                    transform: `scaleX(${
                      i < index ? 1 : i === index ? progress : 0
                    })`,
                  }}
                />
              </span>
            ))}
          </div>

          <header className="pointer-events-auto mt-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar
                name={story.author?.name}
                src={story.author?.image}
                size="sm"
                className="ring-2 ring-white/70"
              />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold drop-shadow">
                  {isOwner ? "Your story" : author}
                </p>
                <p className="text-xs text-white/75">
                  {timeAgo(story.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {paused && (
                <span className="grid size-9 place-items-center rounded-full bg-black/30 backdrop-blur">
                  <Pause size={16} />
                </span>
              )}
              {isVideo && (
                <button
                  type="button"
                  aria-label={muted ? "Unmute" : "Mute"}
                  onClick={() => setMuted((m) => !m)}
                  className="relative z-30 grid size-9 place-items-center rounded-full bg-black/30 backdrop-blur transition hover:bg-black/50"
                >
                  {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              )}
              <button
                type="button"
                aria-label="Close story"
                onClick={onClose}
                className="relative z-30 grid size-9 place-items-center rounded-full bg-black/30 backdrop-blur transition hover:bg-black/50 sm:hidden"
              >
                <X size={20} />
              </button>
            </div>
          </header>
        </div>

        {/* Bottom scrim + meta */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-14">
          {error && (
            <p
              role="alert"
              className="mb-3 rounded-xl bg-red-500/20 px-3 py-2 text-center text-sm text-red-200 backdrop-blur"
            >
              {error}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                <Clock size={13} />
                {timeLeft(story.expiresAt)}
              </span>
              {isOwner && vis && (
                <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                  <vis.Icon size={13} />
                  {vis.label}
                </span>
              )}
            </div>

            {isOwner && (
              <button
                type="button"
                title="Delete story"
                aria-label="Delete story"
                disabled={busy}
                onClick={() => onDelete?.(story)}
                className="pointer-events-auto relative z-30 grid size-10 place-items-center rounded-full bg-white/15 backdrop-blur transition hover:bg-red-500/60 disabled:opacity-50"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
