import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  MessageCircle, 
  Users, 
  Search, 
  Send, 
  Phone, 
  Video,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Play,
  Trash2,
  FileText,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getWebSocketService } from '@/services/websocketService';
import { chatRequestApi, ChatRequest } from '@/apis/chatRequestApi';
import { getChatMessages, sendMessage, markAsRead, ChatMessage } from '@/apis/chatApi';
import { imageService } from '@/services/imageService';

interface EnhancedChatMessage extends Omit<ChatMessage, 'isRead'> {
  isRead: boolean;
  isDelivered?: boolean;
  readAt?: string;
  deliveredAt?: string;
  isOwn?: boolean;
  attachments?: {
    type: 'image' | 'file';
    name: string;
    url: string;
    size?: number;
  }[];
}

export default function Tickets() {
  const { user } = useAuth();
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ChatRequest | null>(null);
  const [messages, setMessages] = useState<EnhancedChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{id: string, name: string}[]>([]);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const wsService = getWebSocketService();

  // Load chat requests
  useEffect(() => {
    const loadChatRequests = async () => {
      try {
        setLoading(true);
        console.log('Loading chat requests...');
        const response = await chatRequestApi.getChatRequests();
        console.log('Chat requests response:', response);
        const requests = response.data;
        setChatRequests(requests);
        console.log('Set chat requests:', requests);
      } catch (error) {
        console.error('Error loading chat requests:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChatRequests();
  }, []);

  // Set up WebSocket message listeners
  useEffect(() => {
    const wsService = getWebSocketService();
    
    const handleNewMessage = (data: any) => {
      console.log('Admin received new message:', data);
      
      // Check if this message belongs to the selected chat request
      if (selectedRequest && data.chatRequestId === selectedRequest.id) {
        // Parse message data - it might be a JSON string or object
        let messageData;
        try {
          messageData = typeof data.message === 'string' ? JSON.parse(data.message) : data.message;
          console.log('Parsed message data:', messageData);
        } catch (e) {
          // If parsing fails, treat as plain text
          messageData = { message: data.message };
          console.log('Failed to parse message, using as plain text:', data.message);
        }
        
        const newMessage: EnhancedChatMessage = {
          id: data.id || Date.now().toString(),
          message: messageData.message || data.message,
          senderId: data.senderId || '',
          senderName: data.senderName || 'Unknown',
          senderRole: data.senderRole || 'User',
          timestamp: data.timestamp || new Date().toISOString(),
          isRead: false,
          room: data.room || '',
          isOwn: data.senderId === user?.publicId,
          attachments: messageData.attachments || data.attachments
        };
        
        // If the message contains JSON, extract only the text part
        if (messageData.message && typeof messageData.message === 'string' && messageData.message.includes('{')) {
          try {
            const parsedContent = JSON.parse(messageData.message);
            if (parsedContent.message) {
              newMessage.message = parsedContent.message;
            }
            if (parsedContent.attachments) {
              newMessage.attachments = parsedContent.attachments;
            }
          } catch (e) {
            // Keep original message if parsing fails
          }
        }
        
        setMessages(prev => [...prev, newMessage]);
        
        // Scroll to bottom
        setTimeout(() => {
          if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
          }
        }, 100);
      }
    };

    // Listen for new chat messages
    wsService.on('chat:message:new', handleNewMessage);
    
    // Listen for typing indicators
    const handleTyping = (data: any) => {
      if (data.room === `chat-request-${selectedRequest?.id}` && data.userId !== user?.publicId) {
        setTypingUsers(prev => {
          if (data.isTyping && !prev.find(u => u.id === data.userId)) {
            return [...prev, { id: data.userId, name: data.userName || 'Unknown User' }];
          } else if (!data.isTyping) {
            return prev.filter(u => u.id !== data.userId);
          }
          return prev;
        });
      }
    };

    // Handle chat request status updates
    const handleChatRequestStatusUpdated = (data: any) => {
      console.log('Chat request status updated:', data);
      
      // Update chat requests list
      setChatRequests(prev => 
        prev.map(req => 
          req.id === data.chatRequest?.id ? data.chatRequest : req
        )
      );
      
      // Update selected request if it matches
      if (selectedRequest && data.chatRequest?.id === selectedRequest.id) {
        setSelectedRequest(data.chatRequest);
      }
    };
    
    // Handle chat request assignment
    const handleChatRequestAssigned = (data: any) => {
      console.log('Chat request assigned:', data);
      
      // Update chat requests list
      setChatRequests(prev => 
        prev.map(req => 
          req.id === data.chatRequestId ? { ...req, status: 'active', adminId: data.adminId } : req
        )
      );
      
      // Update selected request if it matches
      if (selectedRequest && data.chatRequestId === selectedRequest.id) {
        setSelectedRequest(prev => prev ? { ...prev, status: 'active', adminId: data.adminId } : null);
      }
    };
    
    // Listen for new chat request notifications
    const handleNewChatRequest = (data: any) => {
      console.log('New chat request notification:', data);
      // Refresh the chat requests list
      const loadChatRequests = async () => {
        try {
          setLoading(true);
          const response = await chatRequestApi.getChatRequests();
          const requests = response.data;
          setChatRequests(requests);
        } catch (error) {
          console.error('Error loading chat requests:', error);
        } finally {
          setLoading(false);
        }
      };
      loadChatRequests();
    };

    wsService.on('user:typing', handleTyping);
    wsService.on('chat_request_status_updated', handleChatRequestStatusUpdated);
    wsService.on('chat_request_assigned', handleChatRequestAssigned);
    wsService.on('chat:request:new', handleNewChatRequest);
    
    // Handle read receipts
    const handleMessageRead = (data: any) => {
      if (data.messageId && selectedRequest) {
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, isRead: true, readAt: data.timestamp || new Date().toISOString() }
            : msg
        ));
      }
    };

    // Handle delivery receipts
    const handleMessageDelivered = (data: any) => {
      if (data.messageId && selectedRequest) {
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, isDelivered: true, deliveredAt: data.timestamp || new Date().toISOString() }
            : msg
        ));
      }
    };

    wsService.on('chat:message:read:receipt', handleMessageRead);
    wsService.on('chat:message:delivered', handleMessageDelivered);
    
    // Join chat room when there's a selected chat request
    if (selectedRequest && wsService.isConnected) {
      const room = `chat-request-${selectedRequest.id}`;
      wsService.joinRoom(room);
      console.log('Admin joined chat room:', room);
    }
    
    return () => {
      wsService.off('chat:message:new', handleNewMessage);
      wsService.off('user:typing', handleTyping);
      wsService.off('chat_request_status_updated', handleChatRequestStatusUpdated);
      wsService.off('chat_request_assigned', handleChatRequestAssigned);
      wsService.off('chat:request:new', handleNewChatRequest);
      wsService.off('chat:message:read:receipt', handleMessageRead);
      wsService.off('chat:message:delivered', handleMessageDelivered);
      
      // Leave chat room when component unmounts or selected request changes
      if (selectedRequest) {
        const room = `chat-request-${selectedRequest.id}`;
        wsService.leaveRoom(room);
        console.log('Admin left chat room:', room);
      }
    };
  }, [selectedRequest, user?.publicId]);

  // WebSocket connection status
  useEffect(() => {
    const handleConnectionStatus = (status: { connected: boolean }) => {
      setIsConnected(status.connected);
    };

    wsService.on('connection:status', handleConnectionStatus);
    setIsConnected(wsService.isConnected);

    return () => {
      wsService.off('connection:status', handleConnectionStatus);
    };
  }, [wsService]);

  // Load messages for selected request
  useEffect(() => {
    if (selectedRequest) {
      loadMessages(selectedRequest.id);
    }
  }, [selectedRequest]);

  // Mark messages as read when they are viewed
  useEffect(() => {
    if (selectedRequest && messages.length > 0) {
      const room = `chat-request-${selectedRequest.id}`;
      // Mark messages as read after a short delay to ensure they are visible
      const timer = setTimeout(() => {
        markAsRead({ room });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [selectedRequest, messages]);

  const loadMessages = async (requestId: string) => {
    try {
      const room = `chat-request-${requestId}`;
      const requestMessages = await getChatMessages({ room });
      // Convert to EnhancedChatMessage format
      const enhancedMessages: EnhancedChatMessage[] = requestMessages.map(msg => {
        // Parse message data - it might be a JSON string or object
        let messageData;
        try {
          messageData = typeof msg.message === 'string' ? JSON.parse(msg.message) : msg.message;
        } catch (e) {
          // If parsing fails, treat as plain text
          messageData = { message: msg.message };
        }
        
        let finalMessage = messageData.message || msg.message;
        let finalAttachments = messageData.attachments || (msg as any).attachments;
        
        // If the message contains JSON, extract only the text part
        if (finalMessage && typeof finalMessage === 'string' && finalMessage.includes('{')) {
          try {
            const parsedContent = JSON.parse(finalMessage);
            if (parsedContent.message) {
              finalMessage = parsedContent.message;
            }
            if (parsedContent.attachments) {
              finalAttachments = parsedContent.attachments;
            }
          } catch (e) {
            // Keep original message if parsing fails
          }
        }
        
        return {
          ...msg,
          message: finalMessage,
          isOwn: msg.senderId === user?.publicId,
          attachments: finalAttachments
        } as EnhancedChatMessage;
      });
      setMessages(enhancedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRequest) return;

    try {
      // Send message via WebSocket
      const room = `chat-request-${selectedRequest.id}`;
      wsService.sendChatMessage(newMessage.trim(), room);
      
      // Don't add to local state - let WebSocket handle it to avoid duplication
      setNewMessage('');
      
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator
    if (selectedRequest) {
      const room = `chat-request-${selectedRequest.id}`;
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      if (e.target.value.trim() && !isTyping) {
        setIsTyping(true);
        wsService.startTyping(room);
      } else if (!e.target.value.trim() && isTyping) {
        setIsTyping(false);
        wsService.stopTyping(room);
        return;
      }
      
      // Set timeout to stop typing after 3 seconds of inactivity
      if (e.target.value.trim()) {
        typingTimeoutRef.current = setTimeout(() => {
          if (isTyping) {
            setIsTyping(false);
            wsService.stopTyping(room);
          }
        }, 3000);
      }
    }
  };

  const handleInputFocus = () => {
    // Handle focus if needed
  };

  const handleInputBlur = () => {
    // Stop typing when input loses focus
    if (isTyping && selectedRequest) {
      const room = `chat-request-${selectedRequest.id}`;
      setIsTyping(false);
      wsService.stopTyping(room);
    }
  };

  // Cleanup typing indicator when component unmounts or selected request changes
  useEffect(() => {
    return () => {
      if (isTyping && selectedRequest) {
        const room = `chat-request-${selectedRequest.id}`;
        wsService.stopTyping(room);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, selectedRequest, wsService]);

  // Cleanup typing indicator when selected request changes
  useEffect(() => {
    if (isTyping && selectedRequest) {
      const room = `chat-request-${selectedRequest.id}`;
      wsService.stopTyping(room);
      setIsTyping(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [selectedRequest]);

  const handleStartConversation = async (request: ChatRequest) => {
    try {
      await chatRequestApi.assignChatRequest(request.id, user?.id || '');
      setSelectedRequest({ ...request, status: 'active', adminId: user?.id });
      
      // Update the request in the list
      setChatRequests(prev => 
        prev.map(req => 
          req.id === request.id 
            ? { ...req, status: 'active', adminId: user?.id }
            : req
        )
      );
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const handleCloseRequest = async (request: ChatRequest) => {
    try {
      await chatRequestApi.closeChatRequest(request.id);
      setSelectedRequest(null);
      
      // Update the request in the list
      setChatRequests(prev => 
        prev.map(req => 
          req.id === request.id 
            ? { ...req, status: 'closed' }
            : req
        )
      );
    } catch (error) {
      console.error('Error closing request:', error);
    }
  };

  const handleDeleteRequest = async (request: ChatRequest) => {
    try {
      if (window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
        await chatRequestApi.deleteChatRequest(request.id);
        
        // Remove from the list
        setChatRequests(prev => prev.filter(req => req.id !== request.id));
        
        // Clear selected request if it was the deleted one
        if (selectedRequest?.id === request.id) {
          setSelectedRequest(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error deleting request:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case 'active':
        return <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'closed':
        return <X className="h-4 w-4 text-slate-500 dark:text-slate-400" />;
      default:
        return <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800';
      case 'active':
        return 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800';
      case 'closed':
        return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800';
      case 'high':
        return 'bg-orange-50 text-orange-900 border-orange-200 dark:bg-orange-950/20 dark:text-orange-300 dark:border-orange-800';
      case 'normal':
        return 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800';
      case 'low':
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const filteredRequests = chatRequests.filter(request => {
    const matchesSearch = request.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.shopOwner?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getFileUrl = (fileId: string): string => {
    // Use the image service to get the URL
    const url = imageService.getImageUrl(fileId);
    
    // If the image service returns a local path, check if we have the data
    if (url.startsWith('/chat-images/')) {
      const imageData = imageService.getImageData(fileId);
      if (imageData && imageData.data) {
        return imageData.data; // Return the base64 data
      } else {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA2NEgxMTJWMTI4SDgwVjY0WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNjQgMTQ0SDg4VjE2MEg2NFYxNDRaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMDQgMTQ0SDEyOFYxNjBIMTA0VjE0NFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
      }
    }
    
    return url;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
        <p className="text-muted-foreground">
          Manage customer support chat requests and conversations
        </p>
      </div>

      <Card className="h-[80vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Ticket Management</CardTitle>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-emerald-500" : "bg-red-500"
                )} />
                <p className="text-sm text-muted-foreground">
                  {isConnected ? 'Live Support' : 'Offline'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {filteredRequests.length} tickets
            </Badge>
            <Badge variant="outline" className="text-xs">
              {filteredRequests.filter(r => r.status === 'active').length} active
            </Badge>
          </div>
        </CardHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Chat Requests List */}
          <div className="w-1/3 border-r flex flex-col">
            <div className="p-4 border-b space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Requests</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {loading ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Loading requests...
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No chat requests found</p>
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-all duration-200 shadow-sm",
                        selectedRequest?.id === request.id
                          ? "bg-primary/5 border-primary/30 shadow-md ring-1 ring-primary/20"
                          : "hover:bg-muted/30 hover:shadow-md hover:border-muted-foreground/20"
                      )}
                      onClick={() => setSelectedRequest(request)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {request.shopOwner?.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                              "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
                              request.status === 'active' ? "bg-emerald-500" : 
                              request.status === 'pending' ? "bg-amber-500" : "bg-slate-400"
                            )} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {request.shopOwner?.name || 'Unknown User'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {request.shopOwner?.role || 'Shop Owner'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", getStatusColor(request.status))}
                          >
                            {request.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {request.subject && (
                        <p className="text-sm text-muted-foreground mb-2 truncate">
                          {request.subject}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", getPriorityColor(request.priority))}
                          >
                            {request.priority}
                          </Badge>
                          {request.adminId && (
                            <Badge variant="secondary" className="text-xs">
                              Assigned
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground">
                            {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : ''}
                          </span>
                          <div className="text-xs text-muted-foreground/70">
                            {request.createdAt ? new Date(request.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-2">
                        {request.status === 'pending' && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartConversation(request);
                            }}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Start
                          </Button>
                        )}
                        {(request.status === 'closed' || request.status === 'active') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRequest(request);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Messages */}
          {selectedRequest ? (
            <>
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {selectedRequest.shopOwner?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
                          selectedRequest.status === 'active' ? "bg-emerald-500" : 
                          selectedRequest.status === 'pending' ? "bg-amber-500" : "bg-slate-400"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {selectedRequest.shopOwner?.name || 'Unknown User'}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", getPriorityColor(selectedRequest.priority))}
                          >
                            {selectedRequest.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {selectedRequest.subject || 'No subject'}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          {selectedRequest.createdAt ? `Created ${new Date(selectedRequest.createdAt).toLocaleString()}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getStatusColor(selectedRequest.status))}
                      >
                        {selectedRequest.status}
                      </Badge>
                      {selectedRequest.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCloseRequest(selectedRequest)}
                        >
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex flex-col",
                          message.isOwn ? "items-end" : "items-start"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-xs text-muted-foreground">
                            {message.senderName || (message.isOwn ? 'You' : 'Customer')}
                          </div>
                          <div className="text-xs text-muted-foreground/70">
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                            message.isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          )}
                        >
                          {message.message && message.message.trim() && <p className="mb-2">{message.message}</p>}
                          
                          {/* Attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="space-y-2">
                              {message.attachments.map((attachment, index) => (
                                <div key={index} className="max-w-full">
                                  {attachment.type === 'image' ? (
                                    <div className="relative group">
                                      <img
                                        src={getFileUrl(attachment.url)}
                                        alt={attachment.name}
                                        className="max-w-48 max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                        onError={(e) => {
                                          console.error('Image failed to load:', attachment.url, 'Processed URL:', getFileUrl(attachment.url));
                                          // Show a placeholder instead of hiding
                                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA2NEgxMTJWMTI4SDgwVjY0WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNjQgMTQ0SDg4VjE2MEg2NFYxNDRaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMDQgMTQ0SDEyOFYxNjBIMTA0VjE0NFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                                        }}
                                        onClick={() => {
                                          // Open image in new tab for full view
                                          window.open(getFileUrl(attachment.url), '_blank');
                                        }}
                                      />
                                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          className="h-6 w-6 p-0"
                                          onClick={() => window.open(getFileUrl(attachment.url), '_blank')}
                                        >
                                          <Download className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 p-2 bg-background/50 rounded border">
                                      <FileText className="h-4 w-4" />
                                      <span className="text-xs truncate">{attachment.name}</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => window.open(getFileUrl(attachment.url), '_blank')}
                                      >
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {message.isOwn && (
                            <div className="flex items-center justify-end gap-1 mt-1">
                              {message.isRead ? (
                                <div className="flex items-center gap-0.5">
                                  <CheckCircle className="h-3 w-3 text-primary-foreground/70" />
                                  <CheckCircle className="h-3 w-3 text-primary-foreground/70 -ml-1" />
                                </div>
                              ) : message.isDelivered ? (
                                <div className="flex items-center gap-0.5">
                                  <CheckCircle className="h-3 w-3 text-primary-foreground/50" />
                                  <CheckCircle className="h-3 w-3 text-primary-foreground/50 -ml-1" />
                                </div>
                              ) : (
                                <CheckCircle className="h-3 w-3 text-primary-foreground/50" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Typing indicator */}
                    {typingUsers.length > 0 && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span>
                              {typingUsers.length === 1 
                                ? `${typingUsers[0].name} is typing...` 
                                : `${typingUsers.map(u => u.name).join(', ')} are typing...`
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                {selectedRequest.status === 'active' && (
                  <div className="p-4 border-t bg-slate-50/30 dark:bg-slate-900/30">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <Input
                          value={newMessage}
                          onChange={handleInputChange}
                          onKeyPress={handleKeyPress}
                          onFocus={handleInputFocus}
                          onBlur={handleInputBlur}
                          placeholder="Type your message..."
                          className="pr-10"
                        />
                        {isTyping && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="flex gap-1">
                              <div className="w-1 h-1 bg-muted-foreground/60 rounded-full animate-bounce"></div>
                              <div className="w-1 h-1 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-1 h-1 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button 
                        onClick={handleSendMessage} 
                        size="sm"
                        disabled={!newMessage.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    {typingUsers.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {typingUsers.length === 1 
                          ? `${typingUsers[0].name} is typing...` 
                          : `${typingUsers.map(u => u.name).join(', ')} are typing...`
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Select a chat request to start conversation</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}


