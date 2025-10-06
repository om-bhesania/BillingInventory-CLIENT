import React, { useState, useEffect, useRef } from 'react';
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

interface AdminChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminChatPanel: React.FC<AdminChatPanelProps> = ({ isOpen, onClose }) => {
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

    if (isOpen) {
      loadChatRequests();
    }
  }, [isOpen]);

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

    wsService.on('user:typing', handleTyping);
    wsService.on('chat_request_status_updated', handleChatRequestStatusUpdated);
    
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
        let finalAttachments = messageData.attachments || msg.attachments;
        
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
        };
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

  const handleCloseAdminPanel = () => {
    onClose();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[1001] flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-[80vh] flex flex-col">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">Manage Chats</CardTitle>
                <p className="text-white/80 text-sm">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseAdminPanel}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Chat Requests List */}
          <div className="w-1/3 border-r flex flex-col">
            <div className="p-4 border-b">
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
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
                  <div className="text-center py-4 text-gray-500">
                    Loading requests...
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No chat requests found</p>
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedRequest?.id === request.id
                          ? "bg-blue-50 border-blue-200"
                          : "hover:bg-gray-50"
                      )}
                      onClick={() => setSelectedRequest(request)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {request.shopOwner?.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {request.shopOwner?.name || 'Unknown User'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {request.shopOwner?.role || 'Shop Owner'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", getStatusColor(request.status))}
                          >
                            {request.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {request.subject && (
                        <p className="text-sm text-gray-600 mb-2 truncate">
                          {request.subject}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", getPriorityColor(request.priority))}
                        >
                          {request.priority}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : ''}
                        </span>
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
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {selectedRequest.shopOwner?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {selectedRequest.shopOwner?.name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedRequest.subject || 'No subject'}
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
                          "flex",
                          message.isOwn ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                            message.isOwn
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-900"
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
                          
                          <div className={cn(
                            "flex items-center justify-between text-xs mt-1",
                            message.isOwn ? "text-blue-100" : "text-gray-500"
                          )}>
                            <span>{formatTime(message.timestamp)}</span>
                            {message.isOwn && (
                              <div className="flex items-center gap-1">
                                {message.isRead ? (
                                  <div className="flex items-center gap-0.5">
                                    <CheckCircle className="h-3 w-3 text-blue-300" />
                                    <CheckCircle className="h-3 w-3 text-blue-300 -ml-1" />
                                  </div>
                                ) : message.isDelivered ? (
                                  <div className="flex items-center gap-0.5">
                                    <CheckCircle className="h-3 w-3 text-gray-400" />
                                    <CheckCircle className="h-3 w-3 text-gray-400 -ml-1" />
                                  </div>
                                ) : (
                                  <CheckCircle className="h-3 w-3 text-gray-400" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Typing indicator */}
                    {typingUsers.length > 0 && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
                  <div className="p-4 border-t">
                    <div className="flex items-center gap-2">
                      <Input
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        placeholder="Type your message..."
                        className="flex-1"
                      />
                      <Button onClick={handleSendMessage} size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a chat request to start conversation</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminChatPanel;