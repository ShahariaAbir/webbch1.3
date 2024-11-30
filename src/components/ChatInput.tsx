import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, X, CornerDownRight } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
  replyToMessage?: string | null;
  onCancelReply?: () => void;
}

export default function ChatInput({ 
  onSendMessage, 
  disabled,
  replyToMessage,
  onCancelReply 
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    try {
      setSending(true);
      await onSendMessage(message.trim());
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800 bg-gray-900/95">
      {replyToMessage && (
        <div className="mb-2 flex items-start gap-2 p-2 pl-3 bg-gray-800 rounded-lg border-l-4 border-emerald-500">
          <CornerDownRight className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-emerald-500 mb-0.5">
              Replying to message
            </div>
            <div className="text-sm text-gray-300 truncate">
              {replyToMessage}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancelReply}
            className="h-6 w-6 hover:bg-gray-700 -mt-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="flex items-center gap-2 bg-gray-800 rounded-full p-1 pl-4">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500"
          disabled={disabled || sending}
        />
        <Button 
          type="submit" 
          size="icon"
          className="h-9 w-9 rounded-full bg-emerald-500 hover:bg-emerald-600"
          disabled={disabled || sending || !message.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}