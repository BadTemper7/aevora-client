import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "../../utils/cn";

const DEFAULT_EMOJIS = [
  "😀",
  "😄",
  "😁",
  "😂",
  "🤣",
  "😊",
  "😍",
  "😘",
  "😎",
  "🤩",
  "🥳",
  "🤔",
  "😅",
  "😢",
  "😭",
  "😡",
  "🙃",
  "😴",
  "🤯",
  "🥰",
  "😇",
  "🤗",
  "🫡",
  "🤝",
  "👍",
  "👎",
  "👏",
  "🙌",
  "🙏",
  "💪",
  "✌️",
  "🤞",
  "👀",
  "🔥",
  "💯",
  "✨",
  "🎉",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "💔",
  "⭐",
  "🌈",
  "☀️",
  "☕",
  "🍕",
  "🎮",
  "🎧",
  "📷",
  "💻",
  "📱",
  "🚀",
  "⚽",
  "🏆",
  "📌",
  "✅",
];

export default function EmojiPicker({
  open,
  onSelect,
  onClose,
  anchorRef,
  emojis = DEFAULT_EMOJIS,
  columns = 7,
  className,
}) {
  const pickerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const [coords, setCoords] = useState({ top: -9999, left: -9999 });

  // Keep onClose in a ref to avoid re-triggering the scroll listener on every parent render
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event) => {
      if (pickerRef.current?.contains(event.target)) return;
      if (anchorRef?.current?.contains(event.target)) return;
      onCloseRef.current?.();
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") onCloseRef.current?.();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, anchorRef]);

  // Smart positioning & viewport visibility check
  useLayoutEffect(() => {
    if (!open) {
      setCoords({ top: -9999, left: -9999 });
      return;
    }

    const updatePosition = () => {
      if (!pickerRef.current || !anchorRef?.current) return;

      const anchorRect = anchorRef.current.getBoundingClientRect();

      // Auto-close if the anchor button scrolls out of the viewport
      if (
        anchorRect.bottom < 0 ||
        anchorRect.top > window.innerHeight ||
        anchorRect.right < 0 ||
        anchorRect.left > window.innerWidth ||
        anchorRect.width === 0 ||
        anchorRect.height === 0
      ) {
        onCloseRef.current?.();
        return;
      }

      const pickerRect = pickerRef.current.getBoundingClientRect();

      // 1. Vertical positioning (Top/Bottom flip)
      let top = anchorRect.top - pickerRect.height - 8;
      const spaceAbove = anchorRect.top;
      const spaceBelow = window.innerHeight - anchorRect.bottom;

      if (spaceAbove < pickerRect.height + 8 && spaceBelow > spaceAbove) {
        top = anchorRect.bottom + 8;
      }
      top = Math.max(16, top);

      // 2. Horizontal positioning (Left/Right clamp)
      let left = anchorRect.left;
      if (left + pickerRect.width > window.innerWidth - 16) {
        left = window.innerWidth - pickerRect.width - 16;
      }
      left = Math.max(16, left);

      setCoords({ top, left });
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    // Use capture=true to catch scrolling within nested containers
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={pickerRef}
      role="dialog"
      aria-label="Insert an emoji"
      style={{
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        // Hide until positioned to avoid flashing in the wrong spot
        opacity: coords.top === -9999 ? 0 : 1,
        transition: "opacity 0.1s ease-in-out",
      }}
      className={cn(
        "fixed z-[100] w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-surface p-2 shadow-lg",
        className,
      )}
    >
      <div
        className="custom-scrollbar grid max-h-56 gap-1 overflow-y-auto overflow-x-hidden overscroll-contain pr-1"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect?.(emoji)}
            className="grid aspect-square w-full place-items-center rounded-lg text-lg transition-colors hover:bg-line/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-soft"
          >
            <span aria-hidden="true">{emoji}</span>
            <span className="sr-only">Insert {emoji}</span>
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}
