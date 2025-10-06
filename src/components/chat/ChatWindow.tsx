import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  X, 
  Users,
  Wifi,
  WifiOff
} from 'lucide-react';
import { getWebSocketService } from '@/services/websocketService';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  room: string;
  timestamp: string;
  userName?: string;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  room?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  onClose,
  room = 'general'
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsService = getWebSocketService();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket connection status
  useEffect(() => {
    const handleConnectionStatus = (status: any) => {
      setIsConnected(status.connected);
    };

    wsService.on('connection:status', handleConnectionStatus);
    setIsConnected(wsService.isConnected);

    return () => {
      wsService.off('connection:status', handleConnectionStatus);
    };
  }, [wsService]);

  // Chat message handling
  useEffect(() => {
    const handleNewMessage = (data: ChatMessage) => {
      if (data.room === room) {
        setMessages(prev => [...prev, data]);
      }
    };

    const handleTyping = (data: { userId: string; room: string; isTyping: boolean }) => {
      if (data.room === room) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      }
    };

    wsService.on('chat:message:new', handleNewMessage);
    wsService.on('user:typing', handleTyping);

    return () => {
      wsService.off('chat:message:new', handleNewMessage);
      wsService.off('user:typing', handleTyping);
    };
  }, [wsService, room]);

  const handleSendMessage = () => {
    if (newMessage.trim() && isConnected) {
      wsService.sendChatMessage(newMessage.trim(), room);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      wsService.startTyping(room);
    }
  };

  const handleTypingStop = () => {
    if (isTyping) {
      setIsTyping(false);
      wsService.stopTyping(room);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md h-[600px] bg-white shadow-2xl flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <CardTitle className="text-lg font-semibold">Chat</CardTitle>
              <Badge variant="outline" className="text-xs">
                {room}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {/* Connection Status */}
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex flex-col flex-1 min-h-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-700">No Messages</h3>
                  <p className="text-muted-foreground text-sm">
                    Start a conversation in the {room} room
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {message.userName || message.userId}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm">{message.message}</p>
                    </div>
                  </div>
                ))
              )}
              
              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span>
                    {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                  </span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t bg-muted/50 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder={isConnected ? "Type a message..." : "Connecting..."}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={handleTypingStart}
                onBlur={handleTypingStop}
                disabled={!isConnected}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!isConnected || !newMessage.trim()}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatWindow;

