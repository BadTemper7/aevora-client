import GiphyMessage from "./GiphyMessage";
import { memo, useRef, useState } from "react";
import { AlertCircle, Check, CheckCheck, Clock3, FileDown, Pin, RefreshCcw } from "lucide-react";
import Avatar from "../../../components/ui/Avatar";
import { mediaFile } from "../api/socialApi";
import { MessageActions, MessageReactionSummary } from "../components/MessageActions";
import { messageDeliveryState } from "./messageCache";

export const BUBBLE_THEMES = {
  default: "bg-brand text-on-brand",
  blue: "bg-blue-600 text-white",
  violet: "bg-violet-600 text-white",
  emerald: "bg-emerald-600 text-white",
  rose: "bg-rose-600 text-white",
};
const when = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";

function ChatMessage({ message, previous, next, conversation, userId, onReply, onEdit, onReact, onDelete, onDeleteMe, onPin, onReport, onRetry, onJump, highlighted }) {
  const pressTimer = useRef(null);
  const isMine = message.senderId === userId;
  const sender = conversation.members?.find((m) => m.user?.id === message.senderId)?.user;
  const nickname = conversation.nicknames?.find((n) => n.userId === message.senderId)?.value;
  const recipients = conversation.members?.filter((m) => m.accepted && m.user?.id !== userId).map((m) => m.user.id) || [];
  const status = messageDeliveryState(message, recipients);
  const previouslySame = previous?.senderId === message.senderId && new Date(message.createdAt) - new Date(previous.createdAt) < 5 * 60_000;
  const lastMine = isMine && next?.senderId !== userId;
  const [openToken, setOpenToken] = useState(0);
  const [showGroupReceipts, setShowGroupReceipts] = useState(false);
  const stopPress = () => { clearTimeout(pressTimer.current); };
  const startPress = () => { stopPress(); pressTimer.current = setTimeout(() => setOpenToken((n) => n + 1), 480); };
  return <article
    id={`message-${message._id}`}
    aria-label={isMine ? "Your message" : `${sender?.name || "Participant"}'s message`}
    className={`group/message relative flex gap-2 ${isMine ? "justify-end" : "justify-start"} ${highlighted ? "rounded-xl bg-brand-soft ring-2 ring-brand/50" : ""}`}
    onTouchStart={startPress}
    onTouchMove={stopPress}
    onTouchEnd={stopPress}
    onTouchCancel={stopPress}
  >
    {conversation.type === "group" && !isMine && <span className="w-8 shrink-0 self-end">{!previouslySame && <Avatar name={sender?.name} src={sender?.image} size="sm"/>}</span>}
    <div className="relative max-w-[92%] pt-5 sm:max-w-[82%]">
      <MessageActions
        message={message} currentUserId={userId} isMine={isMine} quickEmoji={conversation.quickEmoji}
        canPin={conversation.type !== "group" || ["owner", "admin"].includes(conversation.members?.find((m) => m.user?.id === userId)?.role)}
        canDeleteEveryone={isMine || (conversation.type === "group" && ["owner", "admin"].includes(conversation.members?.find((m) => m.user?.id === userId)?.role))}
        openRequest={openToken}
        onReply={() => onReply(message)} onEdit={() => onEdit(message)} onReact={onReact}
        onCopy={() => navigator.clipboard.writeText(message.text || "")}
        onPin={() => onPin(message)} onDelete={() => onDelete(message)} onDeleteMe={() => onDeleteMe(message)}
        onReport={() => onReport(message._id)}
      />
      {conversation.type === "group" && !isMine && !previouslySame && <p className="mb-1 pl-2 text-xs font-semibold text-ink-soft">{nickname || sender?.name || sender?.username || "Participant"}</p>}
      <div className={`rounded-2xl px-3 py-2.5 text-sm shadow-sm ${isMine ? BUBBLE_THEMES[conversation.theme] || BUBBLE_THEMES.default : "border border-line bg-raised text-ink"}`}>
        {message.replyTo && <button type="button" className="mb-2 block w-full rounded-lg border-l-2 border-current bg-black/10 px-2 py-1 text-left text-xs opacity-85 hover:opacity-100" onClick={() => onJump(message.replyTo)}>Reply to earlier message</button>}
        {message.deletedAt ? <p className="italic opacity-75">This message was deleted</p> : <>
          {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
          {message.gif?.source === "giphy" && message.gif?.id && <GiphyMessage id={message.gif.id}/>}{message.gif?.url && <img className="mt-1 max-h-72 w-auto max-w-full rounded-lg object-contain" loading="lazy" src={message.gif.url} alt="GIF reaction"/>}
          {message.mediaIds?.map((id) => message.kind === "video"
            ? <video key={id} controls preload="metadata" poster={mediaFile(id, true)} src={mediaFile(id)} className="mt-2 max-h-72 max-w-full rounded-lg"/>
            : message.kind === "file"
              ? <a key={id} href={mediaFile(id)} className="mt-2 flex items-center gap-2 rounded-lg border border-current/30 px-3 py-2 underline underline-offset-2"><FileDown size={19}/> Download attachment</a>
              : <img key={id} loading="lazy" alt="Message attachment" src={mediaFile(id)} className="mt-2 max-h-64 max-w-full rounded-lg object-contain"/>) }
        </>}
        <div className="mt-1 flex items-center justify-end gap-2 text-[10px] opacity-75">
          {message.pinnedAt && <span title="Pinned message"><Pin size={11}/></span>}
          {message.editedAt && <span>Edited</span>}
          <time dateTime={message.createdAt}>{when(message.createdAt)}</time>
        </div>
      </div>
      {!message.deletedAt && <MessageReactionSummary reactions={message.reactions || []} currentUserId={userId} messageId={message._id} onReact={onReact}/>}
      {lastMine && <div className="mt-1 flex items-center justify-end gap-1.5 px-1 text-[11px] text-ink-soft" aria-label={`Message status: ${status}`}>
        {status === "sending" && <><Clock3 size={13} className="animate-pulse"/>Sending</>}
        {status === "sent" && <><Check size={14}/>Sent</>}
        {status === "delivered" && <><CheckCheck size={15}/>Delivered</>}
        {status === "seen" && <><CheckCheck size={15} className="text-blue-500"/>Seen</>}
        {status === "failed" && <><AlertCircle size={14} className="text-danger"/><span className="text-danger">Not sent</span><button type="button" className="inline-flex items-center gap-1 font-semibold underline" onClick={() => onRetry(message)}><RefreshCcw size={12}/>Retry</button></>}
        {conversation.type === "group" && !["sending", "failed"].includes(status) && recipients.length > 0 &&
          <button type="button" aria-expanded={showGroupReceipts} title="Show participant delivery receipts" onClick={() => setShowGroupReceipts((value) => !value)} className="ml-1 underline underline-offset-2">
            {recipients.filter((recipient) => message.readBy?.includes(recipient)).length}/{recipients.length} read
          </button>}
      </div>}
      {lastMine && conversation.type === "group" && showGroupReceipts &&
        <div className="mt-1 max-h-40 overflow-auto rounded-lg border border-line bg-surface p-2 text-xs text-ink shadow-sm" aria-label="Group message delivery receipts">
          {conversation.members.filter((member) => member.accepted && member.user?.id !== userId).map((member) =>
            <div key={member.user.id} className="flex items-center justify-between gap-3 py-0.5">
              <span className="truncate">{member.user.name || member.user.username}</span>
              <span className="shrink-0 text-ink-soft">{message.readBy?.includes(member.user.id) ? "Seen" : message.deliveredTo?.includes(member.user.id) ? "Delivered" : "Sent"}</span>
            </div>)}
        </div>}
    </div>
  </article>;
}
export default memo(ChatMessage);
