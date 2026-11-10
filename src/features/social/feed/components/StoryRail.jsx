import { ChevronLeft, ChevronRight, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Avatar from "../../../../components/ui/Avatar";
import Button from "../../../../components/ui/Button";
import { cn } from "../../../../utils/cn";
import { create, errorText, mediaFile, read, remove, uploadMedia, waitForMedia } from "../../api/socialApi";

function StoryRing({ seen, children }) {
  return <span className={cn("grid size-[68px] place-items-center rounded-full p-[3px]", seen ? "bg-line-strong" : "bg-gradient-to-tr from-[#3f68f5] via-[#7c4df0] to-[#c04bd8]")}>
    <span className="grid size-full place-items-center rounded-full bg-surface p-[2px]">{children}</span>
  </span>;
}
export default function StoryRail({ user }) {
  const query = useQuery({ queryKey: ["stories"], queryFn: () => read("/stories"), staleTime: 20_000, refetchInterval: 60_000 });
  const client = useQueryClient();
  const stories = query.data || [];
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [selected, setSelected] = useState(null);
  const [visibility, setVisibility] = useState("public");
  const [progress, setProgress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  useEffect(() => {
    const elem = scrollRef.current;
    if (!elem) return;
    const check = () => { setCanLeft(elem.scrollLeft > 1); setCanRight(elem.scrollLeft + elem.clientWidth < elem.scrollWidth - 1); };
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [stories.length]);
  const previewUrl = useObjectUrl(preview);
  const pick = (file) => {
    if (!file) return;
    setError("");
    if (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "video/mp4", "video/webm", "video/quicktime"].includes(file.type)) { setError("Select a supported photo or video."); return; }
    setVisibility("public"); setPreview(file);
  };
  const share = async () => {
    if (!preview || busy) return;
    setBusy(true); setError("");
    try {
      setProgress("Uploading story...");
      const uploaded = await uploadMedia(preview, "story", (percent) => setProgress(`Uploading story: ${percent}%`));
      setProgress("Optimizing story...");
      await waitForMedia(uploaded.id, (item) => setProgress(`Processing story${item.progress ? `: ${item.progress}%` : "..."}`));
      setProgress("Publishing story...");
      await create("/stories", { mediaId: uploaded.id, visibility });
      setPreview(null);
      await client.invalidateQueries({ queryKey: ["stories"] });
    } catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); setProgress(""); }
  };
  const view = async (story) => {
    setError(""); setSelected(story);
    try { await create(`/stories/${story.id}/view`); client.invalidateQueries({ queryKey: ["stories"] }); }
    catch (cause) { setError(errorText(cause)); }
  };
  const deleteStory = async () => {
    if (!selected || busy) return;
    setBusy(true);
    try { await remove(`/stories/${selected.id}`); setSelected(null); client.invalidateQueries({ queryKey: ["stories"] }); }
    catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  };
  return <>
    <section aria-label="Stories" className="rounded-2xl border border-line bg-surface px-4 pb-3 pt-4">
      <div className="flex items-center gap-3 sm:gap-4">
        <input type="file" ref={fileRef} accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime" className="sr-only" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }}/>
        <button type="button" onClick={() => fileRef.current?.click()} className="group flex w-[76px] shrink-0 flex-col items-center gap-2" aria-label="Add a story">
          <span className="relative"><Avatar name={user?.name} size="lg" className="size-[68px] text-2xl"/><span className="absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full border-2 border-surface bg-brand text-on-brand transition-transform group-hover:scale-110"><Plus size={15}/></span></span>
          <span className="w-full truncate text-center text-xs font-medium text-ink">Add story</span>
        </button>
        <div className="relative min-w-0 flex-1">
          {canLeft && <button type="button" aria-label="Scroll stories left" onClick={() => scrollRef.current?.scrollBy({ left: -220, behavior: "smooth" })} className="absolute left-1 top-4 z-10 grid size-8 place-items-center rounded-full border border-line bg-surface shadow"><ChevronLeft size={18}/></button>}
          {canRight && <button type="button" aria-label="Scroll stories right" onClick={() => scrollRef.current?.scrollBy({ left: 220, behavior: "smooth" })} className="absolute right-1 top-4 z-10 grid size-8 place-items-center rounded-full border border-line bg-surface shadow"><ChevronRight size={18}/></button>}
          <ul ref={scrollRef} className="no-scrollbar flex snap-x gap-3 overflow-x-auto py-1 sm:gap-4" onScroll={(e) => { const el = e.currentTarget; setCanLeft(el.scrollLeft > 1); setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1); }}>
            {stories.map((story) => <li key={story.id} className="snap-start"><button type="button" onClick={() => view(story)} className="flex w-[76px] flex-col items-center gap-2" aria-label={`View ${story.author?.name || "user"}'s story`}>
              <StoryRing seen={story.seen}><Avatar size="lg" name={story.author?.name} src={story.author?.image} className="size-full text-xl"/></StoryRing>
              <span className={cn("w-full truncate text-center text-xs", story.seen ? "text-ink-soft" : "font-semibold text-ink")}>{story.ownerId === user?.id ? "Your story" : (story.author?.name || "User").split(" ")[0]}</span>
            </button></li>)}
          </ul>
          {!query.isPending && stories.length === 0 && <p className="px-2 py-5 text-sm text-ink-soft">Share a story to get started.</p>}
        </div>
      </div>
      {query.error && <p role="alert" className="mt-2 text-xs text-danger">{errorText(query.error)}</p>}
      {error && !preview && !selected && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
    </section>
    {preview && createPortal(<div role="dialog" aria-modal="true" aria-label="Preview your story" className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white">
      <div className="flex items-center justify-between px-4 py-4"><button disabled={busy} onClick={() => setPreview(null)} aria-label="Close story preview" className="grid size-10 place-items-center rounded-full bg-white/10"><X size={23}/></button><h2 className="font-semibold">Story preview</h2><div className="size-10"/></div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">{preview.type.startsWith("video/") ? <video src={previewUrl} controls playsInline className="max-h-full max-w-full rounded-lg"/> : <img src={previewUrl} alt="Your story preview" className="max-h-full max-w-full rounded-lg object-contain"/>}</div>
      <div className="mx-auto w-full max-w-sm space-y-3 p-5"><label className="flex items-center justify-between gap-2 text-sm"><span>Who can see it?</span><select value={visibility} onChange={(e) => setVisibility(e.target.value)} disabled={busy} className="rounded-lg border border-white/30 bg-black px-3 py-2 text-white"><option value="public">Everyone</option><option value="friends">Friends</option><option value="followers">Followers</option></select></label>
        {progress && <p role="status" className="flex items-center gap-2 text-sm"><LoaderCircle className="size-4 animate-spin"/>{progress}</p>}
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        <Button fullWidth size="lg" loading={busy} onClick={share}>Share story for 24 hours</Button>
      </div>
    </div>, document.body)}
    {selected && createPortal(<div role="dialog" aria-modal="true" aria-label={`${selected.author?.name || "User"}'s story`} className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white">
      <header className="flex items-center justify-between gap-4 px-4 py-3"><div className="flex min-w-0 items-center gap-2"><Avatar name={selected.author?.name} src={selected.author?.image} size="sm"/><span className="truncate text-sm font-semibold">{selected.author?.name || "User"}</span></div><div className="flex gap-2">{selected.ownerId === user?.id && <button title="Delete story" aria-label="Delete story" disabled={busy} onClick={deleteStory} className="grid size-10 place-items-center rounded-full bg-white/10"><Trash2 size={20}/></button>}<button aria-label="Close story" onClick={() => setSelected(null)} className="grid size-10 place-items-center rounded-full bg-white/10"><X size={23}/></button></div></header>
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">{selected.mediaKind === "video" ? <video src={mediaFile(selected.mediaId)} poster={mediaFile(selected.mediaId, true)} controls autoPlay playsInline className="max-h-full max-w-full rounded-lg"/> : <img src={mediaFile(selected.mediaId)} alt={`Story by ${selected.author?.name}`} className="max-h-full max-w-full object-contain"/>}</div>
      <footer className="p-4 text-center text-xs text-white/60">Available until {new Date(selected.expiresAt).toLocaleString()}</footer>
      {error && <p role="alert" className="px-4 pb-4 text-center text-sm text-red-300">{error}</p>}
    </div>, document.body)}
  </>;
}

function useObjectUrl(file) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!file) { setUrl(""); return undefined; }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}
