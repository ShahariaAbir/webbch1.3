import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Reply, CornerDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface ChatMessageProps {
  message: {
    id: string;
    text: string;
    timestamp: Timestamp;
    senderId: string;
    replyTo?: string;
  };
  isCurrentUser: boolean;
  onDelete: () => void;
  onReply?: (message: string) => void;
}

export default function ChatMessage({ 
  message, 
  isCurrentUser, 
  onDelete,
  onReply 
}: ChatMessageProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartX = useRef(0);
  const messageRef = useRef<HTMLDivElement>(null);

  const formatMessageTime = (timestamp: Timestamp | null) => {
    if (!timestamp || !timestamp.toDate) {
      return '';
    }
    try {
      return format(timestamp.toDate(), 'HH:mm');
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    const maxDrag = 100;
    const boundedDiff = Math.max(Math.min(diff, maxDrag), -maxDrag);
    setDragOffset(boundedDiff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (Math.abs(dragOffset) > 50 && onReply) {
      onReply(message.text);
    }
    setDragOffset(0);
  };

  return (
    <div 
      ref={messageRef}
      className={cn(
        'flex group relative transition-transform duration-200 ease-out touch-pan-x mb-1',
        isCurrentUser ? 'justify-end' : 'justify-start'
      )}
      style={{ 
        transform: `translateX(${dragOffset}px)`,
        touchAction: 'pan-x'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {isDragging && Math.abs(dragOffset) > 20 && (
        <div 
          className={cn(
            'absolute top-1/2 -translate-y-1/2 flex items-center text-blue-500',
            dragOffset > 0 ? 'left-4' : 'right-4'
          )}
        >
          <Reply className="h-5 w-5" />
        </div>
      )}
      
      <div className={cn(
        'flex flex-col gap-0.5 max-w-[75%]',
        isCurrentUser ? 'items-end' : 'items-start'
      )}>
        {message.replyTo && (
          <div 
            className={cn(
              'flex flex-col w-full rounded-t-lg px-3 py-2 -mb-1',
              isCurrentUser 
                ? 'bg-emerald-600 rounded-tr-none' 
                : 'bg-gray-700 rounded-tl-none'
            )}
          >
            <div className="flex items-center gap-1 text-xs text-gray-200">
              <CornerDownRight className="h-3 w-3" />
              <span>Reply to</span>
            </div>
            <p className="text-sm text-gray-100 line-clamp-2">{message.replyTo}</p>
          </div>
        )}
        
        <div
          className={cn(
            'relative group px-3 py-2 rounded-lg shadow-sm',
            message.replyTo && 'rounded-t-none',
            isCurrentUser
              ? 'bg-emerald-500 text-white rounded-tr-none'
              : 'bg-gray-800 text-white rounded-tl-none'
          )}
        >
          <div className="relative">
            <p className="break-words text-sm md:text-base">{message.text}</p>
            <div className="absolute -right-1 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex h-6 w-6 hover:bg-black/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onReply?.(message.text);
                }}
              >
                <Reply className="h-3.5 w-3.5 text-gray-100" />
              </Button>
              {isCurrentUser && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-black/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-gray-100" />
                </Button>
              )}
            </div>
          </div>
          <span className={cn(
            'text-[10px] float-right mt-1 ml-2',
            isCurrentUser ? 'text-emerald-100' : 'text-gray-400'
          )}>
            {formatMessageTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}