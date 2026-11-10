import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, FileUp, LoaderCircle, Send, Smile, X } from "lucide-react";
import EmojiPicker from "../../../components/common/EmojiPicker";
import MediaPicker from "../components/MediaPicker";
import { field, smallButton } from "../components/SocialUI";
import GifPicker from "./GifPicker";

export default function ChatComposer({ text, setText, media, setMedia, reply, cancelReply, editing, cancelEditing, onSubmit, onGif, onTyping, onQuickEmoji, quickEmoji = "👍", busy, disabled, mediaPurpose = "message" }) {
  const input = useRef(null);
  const emojiAnchor = useRef(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaKey, setMediaKey] = useState(0);
  useEffect(() => { if (reply || editing) input.current?.focus(); }, [reply?._id, editing?._id]);
  useLayoutEffect(() => {
    const box = input.current;
    if (!box) return;
    // 5 lines at 24px line height plus 20px vertical padding. This also
    // re-measures when entering edit mode and shrinks after sending.
    const minHeight = 44;
    const maxHeight = 140;
    box.style.overflowY = "hidden";
    box.style.height = `${minHeight}px`;
    const measured = box.scrollHeight;
    box.style.height = `${Math.min(maxHeight, Math.max(minHeight, measured))}px`;
    box.style.overflowY = measured > maxHeight ? "auto" : "hidden";
  }, [text, editing?._id]);
  useEffect(() => { if (!media) { setMediaOpen(false); setMediaKey((k) => k + 1); } }, [media]);
  const valid = Boolean(text.trim() || (media && !editing));
  const showQuickEmoji = !editing && !text.trim() && !media;
  const send = (e) => { e?.preventDefault?.(); if (busy || disabled || !valid) return; onSubmit(); };
  return <form className="shrink-0 space-y-2 border-t border-line bg-surface p-3" onSubmit={send} aria-label="Message composer">
    {reply && !editing && <div className="flex items-center justify-between gap-2 rounded-lg border-l-2 border-brand bg-raised px-3 py-2 text-xs text-ink-soft"><span className="min-w-0 truncate">Replying to: {reply.text?.slice(0, 100) || "attachment"}</span><button type="button" onClick={cancelReply} title="Cancel reply"><X size={16}/></button></div>}
    {editing && <div role="status" className="flex items-center justify-between gap-2 rounded-lg border-l-2 border-brand bg-brand-soft px-3 py-2 text-xs font-semibold text-ink"><span>Editing message · Enter to save · Esc to cancel</span><button type="button" onClick={cancelEditing} title="Cancel edit"><X size={16}/></button></div>}
    {media && !editing && <div className="flex items-center justify-between rounded-lg bg-brand-soft px-3 py-2 text-xs text-ink"><span>Attachment ready: {media.kind} <Check size={14} className="inline text-success"/></span><button type="button" onClick={() => setMedia(null)} title="Remove attachment"><X size={16}/></button></div>}
    {mediaOpen && !editing && <MediaPicker key={mediaKey} purpose={mediaPurpose} accept="image/*,video/mp4,video/webm,video/quicktime,application/pdf,text/plain,.pdf,.txt" label="Upload an image, GIF, video or document" onReady={setMedia}/>}
    <div className="flex items-end gap-1.5 sm:gap-2">
      <button type="button" disabled={Boolean(editing)} title="Attach media or a file" aria-label="Attach media or a file" className={smallButton} onClick={() => setMediaOpen((v) => !v)}><FileUp size={18}/></button>
      <div className="relative">
        <button type="button" disabled={Boolean(editing)} aria-expanded={gifOpen} title="Send a GIF" aria-label="Open GIF picker" className={smallButton} onClick={() => { setGifOpen((v) => !v); setEmojiOpen(false); }}><span className="text-xs font-extrabold">GIF</span></button>
        {gifOpen && <GifPicker onSelect={onGif} onClose={() => setGifOpen(false)} busy={busy}/>} 
      </div>
      <div className="relative"><button ref={emojiAnchor} type="button" title="Insert emoji" aria-label="Insert emoji" className={smallButton} onClick={() => { setEmojiOpen((v) => !v); setGifOpen(false); }}><Smile size={18}/></button><EmojiPicker open={emojiOpen} anchorRef={emojiAnchor} onClose={() => setEmojiOpen(false)} onSelect={(emoji) => { setText((s) => `${s}${emoji}`); setEmojiOpen(false); input.current?.focus(); }}/></div>
      <textarea
        ref={input} id="chat-composer" rows={1} maxLength={5000}
        value={text} onChange={(event) => { setText(event.target.value); if (!editing) onTyping?.(Boolean(event.target.value)); }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && editing) { event.preventDefault(); cancelEditing(); }
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent?.isComposing) { event.preventDefault(); send(); }
        }}
        placeholder={editing ? "Update your message..." : "Write a message..."}
        aria-label={editing ? "Edit message" : "Message text"}
        className={`${field} min-h-11 min-w-0 flex-1 !resize-none !py-2.5 leading-6`}
        style={{ resize: "none", height: 44, maxHeight: 140, overflowY: "hidden", boxSizing: "border-box" }}
      />
      {showQuickEmoji ? <button title={`Send ${quickEmoji}`} aria-label={`Send quick emoji ${quickEmoji}`} type="button" onClick={onQuickEmoji} disabled={busy || disabled} className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink text-2xl hover:brightness-95 disabled:opacity-50">{quickEmoji}</button>
        : <button title={editing ? "Save changes" : "Send message"} aria-label={editing ? "Save message changes" : "Send message"} type="submit" disabled={busy || disabled || !valid} className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-on-brand disabled:opacity-50">
          {busy ? <LoaderCircle size={20} className="animate-spin"/> : editing ? <Check size={19}/> : <Send size={19}/>}
        </button>}
    </div>
  </form>;
}
