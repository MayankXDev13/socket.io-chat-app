import type { Message } from '@repo/shared';

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showSender: boolean;
}

export default function MessageBubble({ message, isOwn, showSender }: MessageBubbleProps) {
  return (
    <div className={`flex animate-fade-in ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {showSender && !isOwn && (
          <p className="text-xs text-muted-foreground mb-1 ml-1 font-medium">{message.senderUsername}</p>
        )}
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed ${
            isOwn
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl rounded-br-md'
              : 'bg-secondary text-foreground rounded-2xl rounded-bl-md'
          }`}
        >
          {message.content}
        </div>
        <p className={`text-[10px] text-muted-foreground mt-1 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
