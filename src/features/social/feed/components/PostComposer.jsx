import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { POST_MAX_IMAGES, POST_MAX_LENGTH } from "../../../../app/config/constants";
import Avatar from "../../../../components/ui/Avatar";
import Button from "../../../../components/ui/Button";
import { cn } from "../../../../utils/cn";

export default function PostComposer({ user, onSubmit }) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]); // [{ id, url }]
  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  const location = useLocation();

  // The "Create" buttons link here with { focusComposer: true }
  useEffect(() => {
    if (location.state?.focusComposer) textareaRef.current?.focus();
  }, [location.key, location.state]);

  const remaining = POST_MAX_LENGTH - content.length;
  const canPost = (content.trim().length > 0 || images.length > 0) && remaining >= 0;

  const handleFiles = (event) => {
    const files = Array.from(event.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    event.target.value = "";

    setImages((current) => {
      const room = POST_MAX_IMAGES - current.length;
      const added = files.slice(0, room).map((file) => ({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file),
      }));
      return [...current, ...added];
    });
  };

  const removeImage = (id) => {
    setImages((current) => {
      const target = current.find((image) => image.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return current.filter((image) => image.id !== id);
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canPost) return;

    onSubmit({ content: content.trim(), images });
    setContent("");
    setImages([]); // URLs now belong to the published post
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Create a post"
      className="rounded-2xl border border-line bg-surface p-4 sm:p-5"
    >
      <div className="flex gap-3">
        <Avatar name={user?.name} size="md" />

        <div className="min-w-0 flex-1">
          <label htmlFor="composer" className="sr-only">
            What's on your mind?
          </label>
          <textarea
            id="composer"
            ref={textareaRef}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={3}
            placeholder={`What's on your mind, ${user?.name?.split(" ")[0] ?? "friend"}?`}
            className="w-full resize-none bg-transparent pt-2.5 text-[15px] leading-6 outline-none placeholder:text-ink-faint"
          />

          {images.length > 0 && (
            <ul className="mt-2 grid grid-cols-4 gap-2">
              {images.map((image) => (
                <li key={image.id} className="relative aspect-square overflow-hidden rounded-xl">
                  <img src={image.url} alt="Attached photo" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    aria-label="Remove photo"
                    className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/70 text-white transition-colors hover:bg-black"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
        <div className="flex items-center gap-1">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleFiles}
          />
          <Button
            variant="ghost"
            size="sm"
            leftIcon={ImagePlus}
            disabled={images.length >= POST_MAX_IMAGES}
            onClick={() => fileRef.current?.click()}
          >
            Photo
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {content.length > POST_MAX_LENGTH * 0.8 && (
            <span
              aria-live="polite"
              className={cn("text-xs font-semibold", remaining < 0 ? "text-danger" : "text-ink-soft")}
            >
              {remaining}
            </span>
          )}
          <Button type="submit" size="sm" disabled={!canPost} className="px-5">
            Post
          </Button>
        </div>
      </div>
    </form>
  );
}
