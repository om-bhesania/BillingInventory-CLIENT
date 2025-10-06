import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  X,
  Send,
  Users,
  Search,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
  Plus,
  Clock,
  CheckCircle,
  Image as ImageIcon,
  FileText,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtimeData } from "@/contexts/RealtimeDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import AdminChatPanel from "./AdminChatPanel";
import { getWebSocketService } from "@/services/websocketService";
import { chatRequestApi, ChatRequest } from "@/apis/chatRequestApi";
import { getChatMessages } from "@/apis/chatApi";
import { imageService } from "@/services/imageService";
import useToast from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  message: string;
  sender: string;
  timestamp: string;
  isOwn: boolean;
  isRead?: boolean;
  attachments?: {
    type: "image" | "file";
    name: string;
    url: string;
    size?: number;
  }[];
}

interface FloatingChatProps {
  className?: string;
}

export const FloatingChat: React.FC<FloatingChatProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentChatRequest, setCurrentChatRequest] =
    useState<ChatRequest | null>(null);
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<
    { id: string; name: string }[]
  >([]);
  const [hasActiveRequest, setHasActiveRequest] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<{id: string, url: string}[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isConnected } = useRealtimeData();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addNotification } = useNotifications();

  // Form state for creating chat request
  const [requestForm, setRequestForm] = useState({
    subject: "",
    priority: "normal" as "low" | "normal" | "high" | "urgent",
  });

  // Load chat requests on component mount
  useEffect(() => {
    loadChatRequests();
    loadChatHistory();
  }, []);

  // Load chat history from localStorage
  const loadChatHistory = () => {
    try {
      const savedMessages = localStorage.getItem(
        `chat_history_${user?.publicId}`
      );
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  // Save chat history to localStorage
  const saveChatHistory = (messages: ChatMessage[]) => {
    try {
      localStorage.setItem(
        `chat_history_${user?.publicId}`,
        JSON.stringify(messages)
      );
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  };

  // File handling functions
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const otherFiles = files.filter((file) => !file.type.startsWith("image/"));

    setSelectedFiles((prev) => [...prev, ...files]);

    // Create preview URLs for images and store file IDs using image service
    const newPreviews = await Promise.all(imageFiles.map(async (file) => {
      const fileId = imageService.generateImageId();
      
      try {
        // Save the image using the image service
        const imageUrl = await imageService.saveImage(file, fileId);
        
        return { id: fileId, url: imageUrl };
      } catch (error) {
        console.error('Error saving image:', error);
        // Fallback to blob URL
        const url = URL.createObjectURL(file);
        return { id: fileId, url: url };
      }
    }));
    
    setPreviewImages((prev) => [...prev, ...newPreviews]);

    toast({
      title: "Files Selected",
      description: `${files.length} file(s) selected for upload`,
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index);
      return newFiles;
    });

    setPreviewImages((prev) => {
      const newPreviews = prev.filter((_, i) => i !== index);
      return newPreviews;
    });
  };

  const uploadFile = async (file: File): Promise<string> => {
    // Convert file to base64 for storage
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    // Create a unique ID for this file
    const fileId = `file_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Store file info in localStorage for persistence
    const fileInfo = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      data: base64,
      timestamp: new Date().toISOString(),
    };

    const existingFiles = JSON.parse(
      localStorage.getItem("uploaded_files") || "[]"
    );
    existingFiles.push(fileInfo);
    localStorage.setItem("uploaded_files", JSON.stringify(existingFiles));

    // Return the file ID instead of blob URL
    return fileId;
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

  const convertPreviewToBase64 = async (fileId: string): Promise<string> => {
    const existingFiles = JSON.parse(localStorage.getItem('uploaded_files') || '[]');
    const fileInfo = existingFiles.find((f: any) => f.id === fileId);
    
    if (fileInfo && fileInfo.data) {
      // If it's already base64, return it
      if (fileInfo.data.startsWith('data:')) {
        return fileInfo.data;
      }
      
      // If it's a blob URL, we need to convert it
      // For now, return the blob URL as is
      return fileInfo.data;
    }
    
    return '';
  };

  // Set up WebSocket message listeners and join chat room
  useEffect(() => {
    const wsService = getWebSocketService();

    const handleNewMessage = (data: any) => {
      console.log("Received new message:", data);

      // Check if this message belongs to the current chat request
      if (currentChatRequest && data.chatRequestId === currentChatRequest.id) {
        // Parse message data - it might be a JSON string or object
        let messageData;
        try {
          messageData =
            typeof data.message === "string"
              ? JSON.parse(data.message)
              : data.message;
          console.log("Parsed message data:", messageData);
        } catch (e) {
          // If parsing fails, treat as plain text
          messageData = { message: data.message };
          console.log(
            "Failed to parse message, using as plain text:",
            data.message
          );
        }

        const newMessage: ChatMessage = {
          id: data.id || Date.now().toString(),
          message: messageData.message || data.message,
          sender: data.senderName || "Unknown",
          timestamp: data.timestamp || new Date().toISOString(),
          isOwn: data.senderId === user?.publicId,
          attachments: messageData.attachments || data.attachments,
        };

        setMessages((prev) => {
          const updatedMessages = [...prev, newMessage];
          saveChatHistory(updatedMessages);
          return updatedMessages;
        });

        // Scroll to bottom
        setTimeout(() => {
          if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop =
              scrollAreaRef.current.scrollHeight;
          }
        }, 100);
      } else {
        // Show notification for messages in other chat requests or when chat is not open
        if (data.senderId !== user?.publicId) {
          let displayMessage = data.message;
          try {
            const parsed = JSON.parse(data.message);
            displayMessage = parsed.message || data.message;
          } catch (e) {
            // Keep original message if not JSON
          }

          addNotification({
            type: "CHAT_MESSAGE",
            message: `New message from ${
              data.senderName || "Unknown"
            }: ${displayMessage.substring(0, 50)}${
              displayMessage.length > 50 ? "..." : ""
            }`,
            isRead: false,
            createdAt: data.timestamp || new Date().toISOString(),
          });
        }
      }
    };

    // Listen for new chat messages
    wsService.on("chat:message:new", handleNewMessage);

    // Listen for typing indicators
    const handleTyping = (data: any) => {
      if (
        data.room === `chat-request-${currentChatRequest?.id}` &&
        data.userId !== user?.publicId
      ) {
        setTypingUsers((prev) => {
          if (data.isTyping && !prev.find((u) => u.id === data.userId)) {
            return [
              ...prev,
              { id: data.userId, name: data.userName || "Unknown User" },
            ];
          } else if (!data.isTyping) {
            return prev.filter((u) => u.id !== data.userId);
          }
          return prev;
        });
      }
    };

    // Handle chat request assignment/status updates
    const handleChatRequestAssigned = (data: any) => {
      console.log("Chat request assigned:", data);

      // Update the current chat request if it matches
      if (
        currentChatRequest &&
        data.chatRequest?.id === currentChatRequest.id
      ) {
        const updatedRequest = { 
          ...currentChatRequest, 
          status: "active" as const, 
          adminId: data.chatRequest.adminId 
        };
        setCurrentChatRequest(updatedRequest);

        // Show notification
        addNotification({
          type: "CHAT_REQUEST",
          message:
            data.notification?.message || "Your chat request has been assigned",
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }

      // Update chat requests list
      setChatRequests((prev) =>
        prev.map((req) =>
          req.id === data.chatRequest?.id
            ? { ...req, status: "active", adminId: data.chatRequest.adminId }
            : req
        )
      );
    };

    // Handle chat request status updates
    const handleChatRequestStatusUpdated = (data: any) => {
      console.log("Chat request status updated:", data);

      // Update chat requests list
      setChatRequests((prev) =>
        prev.map((req) =>
          req.id === data.chatRequest?.id ? data.chatRequest : req
        )
      );

      // Update current chat request if it matches
      if (
        currentChatRequest &&
        data.chatRequest?.id === currentChatRequest.id
      ) {
        setCurrentChatRequest(data.chatRequest);
      }
    };

    wsService.on("user:typing", handleTyping);
    wsService.on("chat_request_assigned", handleChatRequestAssigned);
    wsService.on("chat_request_status_updated", handleChatRequestStatusUpdated);

    // Join chat room when there's an active chat request
    if (currentChatRequest && wsService.isConnected) {
      const room = `chat-request-${currentChatRequest.id}`;
      wsService.joinRoom(room);
      console.log("Joined chat room:", room);
    }

    return () => {
      wsService.off("chat:message:new", handleNewMessage);
      wsService.off("user:typing", handleTyping);
      wsService.off("chat_request_assigned", handleChatRequestAssigned);
      wsService.off(
        "chat_request_status_updated",
        handleChatRequestStatusUpdated
      );

      // Leave chat room when component unmounts or chat request changes
      if (currentChatRequest) {
        const room = `chat-request-${currentChatRequest.id}`;
        wsService.leaveRoom(room);
        console.log("Left chat room:", room);
      }
    };
  }, [currentChatRequest, user?.publicId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChatRequests = async () => {
    if (isLoadingRequests) return; // Prevent duplicate calls

    try {
      setIsLoadingRequests(true);
      const response = await chatRequestApi.getChatRequests();
      setChatRequests(response.data);

      // If user is not admin, find their active request
      if (user?.role !== "Admin") {
        const activeRequest = response.data.find(
          (req) =>
            req.shopOwnerId === user?.publicId &&
            (req.status === "pending" || req.status === "active")
        );
        if (activeRequest) {
          setCurrentChatRequest(activeRequest);
          setHasActiveRequest(true);
          await loadChatRequestMessages(activeRequest.id);
        } else {
          setHasActiveRequest(false);
        }
      }
    } catch (error) {
      console.error("Error loading chat requests:", error);
      toast({
        title: "Error",
        description: "Failed to load chat requests",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const loadChatRequestMessages = async (requestId: string) => {
    try {
      // Load messages from the database using the chat API
      const room = `chat-request-${requestId}`;
      const messages = await getChatMessages({ room });

      // Convert to ChatMessage format
      const formattedMessages: ChatMessage[] = messages.map((msg: any) => {
        // Parse message data - it might be a JSON string or object
        let messageData;
        try {
          messageData =
            typeof msg.message === "string"
              ? JSON.parse(msg.message)
              : msg.message;
        } catch (e) {
          // If parsing fails, treat as plain text
          messageData = { message: msg.message };
        }

        return {
          id: msg.id,
          message: messageData.message || msg.message,
          sender: msg.senderName || "Unknown",
          timestamp: msg.timestamp,
          isOwn: msg.senderId === user?.publicId,
          isRead: msg.isRead || false,
          attachments: messageData.attachments || msg.attachments,
        };
      });

      setMessages(formattedMessages);
      console.log("Loaded messages:", formattedMessages);

      // Also load the chat request details
      const requestResponse = await chatRequestApi.getChatRequestDetails(
        requestId
      );
      setCurrentChatRequest(requestResponse.data);
    } catch (error) {
      console.error("Error loading chat request messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const createChatRequest = async () => {
    if (isLoading) return; // Prevent duplicate calls

    try {
      setIsLoading(true);
      const response = await chatRequestApi.createChatRequest(requestForm);
      setChatRequests((prev) => [response.data, ...prev]);
      setCurrentChatRequest(response.data);
      setHasActiveRequest(true);
      setRequestForm({ subject: "", priority: "normal" });
      setIsCreateRequestOpen(false);

      toast({
        title: "Success",
        description: "Chat request created successfully",
      });
    } catch (error: any) {
      console.error("Error creating chat request:", error);

      // If user already has an active request, show proper message
      if (error.response?.data?.requestId) {
        const existingRequestId = error.response.data.requestId;
        try {
          const response = await chatRequestApi.getChatRequestDetails(
            existingRequestId
          );
          setCurrentChatRequest(response.data);
          setChatRequests((prev) => [response.data, ...prev]);
          setIsCreateRequestOpen(false);

          toast({
            title: "One Ticket at a Time",
            description:
              "You already have an active chat request. Please complete your current conversation before starting a new one.",
            variant: "destructive",
          });
        } catch (loadError) {
          console.error("Error loading existing request:", loadError);
          toast({
            title: "One Ticket at a Time",
            description:
              "You already have an active chat request. Please complete your current conversation before starting a new one.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description:
            error.response?.data?.error || "Failed to create chat request",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (
      (!newMessage.trim() && selectedFiles.length === 0) ||
      !currentChatRequest
    )
      return;

    try {
      const wsService = getWebSocketService();
      const room = `chat-request-${currentChatRequest.id}`;

      // Create attachments from selected files
      const attachments = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const preview = previewImages[i];
        
        if (preview) {
          // Convert preview to base64 and store
          const base64Data = await convertPreviewToBase64(preview.id);
          const fileId = await uploadFile(file);
          
          // Update the stored file with base64 data
          const existingFiles = JSON.parse(localStorage.getItem('uploaded_files') || '[]');
          const fileIndex = existingFiles.findIndex((f: any) => f.id === fileId);
          if (fileIndex !== -1) {
            existingFiles[fileIndex].data = base64Data;
            localStorage.setItem('uploaded_files', JSON.stringify(existingFiles));
          }
          
          attachments.push({
            type: file.type.startsWith("image/")
              ? ("image" as const)
              : ("file" as const),
            name: file.name,
            url: fileId,
            size: file.size,
          });
        } else {
          // Fallback: upload file and get ID
          const fileId = await uploadFile(file);
          attachments.push({
            type: file.type.startsWith("image/")
              ? ("image" as const)
              : ("file" as const),
            name: file.name,
            url: fileId,
            size: file.size,
          });
        }
      }

      // Create message with attachments
      const messageData = {
        message:
          newMessage.trim() ||
          (attachments.length > 0 ? `Sent ${attachments.length} file(s)` : ""),
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      // Send message via WebSocket - send as JSON string
      wsService.sendChatMessage(JSON.stringify(messageData), room);

      // Clear form
      setNewMessage("");
      setSelectedFiles([]);
      setPreviewImages([]);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    // Send typing indicator
    if (currentChatRequest) {
      const wsService = getWebSocketService();
      const room = `chat-request-${currentChatRequest.id}`;

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

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEmojiClick = () => {
    // Trigger native emoji picker
    const input = document.createElement('input');
    input.type = 'text';
    input.style.position = 'absolute';
    input.style.left = '-9999px';
    input.style.opacity = '0';
    document.body.appendChild(input);
    
    // Focus the input to trigger emoji picker
    input.focus();
    
    // Listen for input changes
    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.value) {
        setNewMessage((prev) => prev + target.value);
        target.value = ''; // Clear the input
      }
    });
    
    // Clean up after a short delay
    setTimeout(() => {
      document.body.removeChild(input);
    }, 100);
  };

  const toggleChat = () => {
    if (isOpen) {
      setIsMinimized(!isMinimized);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const openAdminPanel = () => {
    setIsAdminPanelOpen(true);
    // Don't close the chat bubble, just open the admin panel
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  // Cleanup typing indicator when component unmounts or chat request changes
  useEffect(() => {
    return () => {
      if (isTyping && currentChatRequest) {
        const room = `chat-request-${currentChatRequest.id}`;
        const wsService = getWebSocketService();
        wsService.stopTyping(room);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, currentChatRequest]);

  // Cleanup typing indicator when chat request changes
  useEffect(() => {
    if (isTyping && currentChatRequest) {
      const room = `chat-request-${currentChatRequest.id}`;
      const wsService = getWebSocketService();
      wsService.stopTyping(room);
      setIsTyping(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [currentChatRequest]);

  // Listen for open floating chat event
  useEffect(() => {
    const handleOpenFloatingChat = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };

    window.addEventListener("open-floating-chat", handleOpenFloatingChat);
    return () => {
      window.removeEventListener("open-floating-chat", handleOpenFloatingChat);
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "closed":
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Waiting for admin";
      case "active":
        return "In conversation";
      case "closed":
        return "Closed";
      default:
        return "Unknown";
    }
  };

  if (!isOpen) {
    return (
      <div className={cn("fixed bottom-6 right-6 z-[999]", className)}>
        <Button
          onClick={toggleChat}
          className="h-14 w-14 rounded-full shadow-lg"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("fixed bottom-24 right-6 z-[900] w-80", className)}>
      <Card
        className={cn(
          "shadow-2xl border-0 transition-all duration-300",
          isMinimized ? "h-16" : "h-[500px]"
        )}
      >
        <CardHeader
          className={cn(
            "flex flex-row items-center justify-between space-y-0 pb-2 p-4",
            isMinimized ? "pb-2" : ""
          )}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                Support Chat
              </CardTitle>
              {!isMinimized && (
                <p className="text-xs text-muted-foreground">
                  {isConnected ? "Connected" : "Disconnected"}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isConnected && (
              <Badge variant="secondary" className="text-xs">
                Live
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={isMinimized ? toggleChat : closeChat}
              className="h-6 w-6 p-0"
            >
              {isMinimized ? (
                <MessageCircle className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-full">
            {/* Chat Request Status or Quick Actions */}
            <div className="p-4 border-b">
              {user?.role === "Admin" ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={openAdminPanel}
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Manage Chats
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Search className="h-3 w-3 mr-1" />
                    Find Answer
                  </Button>
                </div>
              ) : currentChatRequest ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(currentChatRequest.status)}
                      <span className="text-sm font-medium">
                        {getStatusText(currentChatRequest.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {currentChatRequest.priority}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentChatRequest(null)}
                        className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {currentChatRequest.subject && (
                    <p className="text-xs text-muted-foreground truncate">
                      {currentChatRequest.subject}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">
                      Conversation History
                    </h3>
                    <Dialog
                      open={isCreateRequestOpen}
                      onOpenChange={setIsCreateRequestOpen}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" className="h-7 px-2 text-xs">
                          <Plus className="h-3 w-3 mr-1" />
                          New
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Start a Conversation</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">
                              Subject (optional)
                            </label>
                            <Input
                              placeholder="What can we help you with?"
                              value={requestForm.subject}
                              onChange={(e) =>
                                setRequestForm((prev) => ({
                                  ...prev,
                                  subject: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Priority
                            </label>
                            <Select
                              value={requestForm.priority}
                              onValueChange={(value: any) =>
                                setRequestForm((prev) => ({
                                  ...prev,
                                  priority: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            onClick={createChatRequest}
                            disabled={isLoading || hasActiveRequest}
                            className="w-full"
                          >
                            {isLoading
                              ? "Creating..."
                              : hasActiveRequest
                              ? "One Ticket at a Time"
                              : "Start Conversation"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {isLoadingRequests ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-muted-foreground">
                          Loading conversations...
                        </span>
                      </div>
                    </div>
                  ) : chatRequests.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {chatRequests.slice(0, 3).map((request) => (
                        <div
                          key={request.id}
                          onClick={async () => {
                            setCurrentChatRequest(request);
                            await loadChatRequestMessages(request.id);
                          }}
                          className="p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium truncate">
                              {request.subject || "No subject"}
                            </span>
                            <div className="flex items-center gap-1">
                              <Badge
                                variant={
                                  request.status === "closed"
                                    ? "secondary"
                                    : "default"
                                }
                                className="text-xs"
                              >
                                {request.status}
                              </Badge>
                              {request.status === "closed" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (
                                      confirm(
                                        "Are you sure you want to delete this conversation?"
                                      )
                                    ) {
                                      try {
                                        await chatRequestApi.deleteChatRequest(
                                          request.id
                                        );
                                        setChatRequests((prev) =>
                                          prev.filter(
                                            (req) => req.id !== request.id
                                          )
                                        );
                                        if (
                                          currentChatRequest?.id === request.id
                                        ) {
                                          setCurrentChatRequest(null);
                                          setMessages([]);
                                        }
                                        toast({
                                          title: "Success",
                                          description:
                                            "Conversation deleted successfully",
                                        });
                                      } catch (error) {
                                        toast({
                                          title: "Error",
                                          description:
                                            "Failed to delete conversation",
                                          variant: "destructive",
                                        });
                                      }
                                    }
                                  }}
                                  title="Delete conversation"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                      {chatRequests.length > 3 && (
                        <div className="text-center pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              // Could implement a full conversation history modal here
                              console.log("View all conversations");
                            }}
                          >
                            View All ({chatRequests.length})
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        Start a conversation with our support team
                      </p>
                      <Dialog
                        open={isCreateRequestOpen}
                        onOpenChange={setIsCreateRequestOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="w-full"
                            disabled={hasActiveRequest}
                            onClick={() => {
                              if (hasActiveRequest) {
                                toast({
                                  title: "One Ticket at a Time",
                                  description:
                                    "You already have an active chat request. Please complete your current conversation before starting a new one.",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            {hasActiveRequest
                              ? "One Ticket at a Time"
                              : "Start Conversation"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Start a Conversation</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">
                                Subject (optional)
                              </label>
                              <Input
                                placeholder="What can we help you with?"
                                value={requestForm.subject}
                                onChange={(e) =>
                                  setRequestForm((prev) => ({
                                    ...prev,
                                    subject: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                Priority
                              </label>
                              <Select
                                value={requestForm.priority}
                                onValueChange={(value: any) =>
                                  setRequestForm((prev) => ({
                                    ...prev,
                                    priority: value,
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="normal">Normal</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              onClick={createChatRequest}
                              disabled={isLoading || hasActiveRequest}
                              className="w-full"
                            >
                              {isLoading
                                ? "Creating..."
                                : hasActiveRequest
                                ? "One Ticket at a Time"
                                : "Start Conversation"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
              <div className="space-y-3">
                {isLoadingRequests ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-muted-foreground">
                        Loading messages...
                      </span>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No messages yet
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        Start a conversation to begin chatting
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex flex-col",
                        message.isOwn ? "items-end" : "items-start"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-xs text-muted-foreground">
                          {message.sender ||
                            (message.isOwn ? "You" : "Customer")}
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
                        {message.message && (
                          <p className="mb-2">{message.message}</p>
                        )}

                        {/* Attachments */}
                        {message.attachments &&
                          message.attachments.length > 0 && (
                            <div className="space-y-2">
                              {message.attachments.map((attachment, index) => (
                                <div key={index} className="max-w-full">
                                  {attachment.type === "image" ? (
                                    <div className="relative group">
                                      <img
                                        src={getFileUrl(attachment.url)}
                                        alt={attachment.name}
                                        className="max-w-48 max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => {
                                          // Open image in new tab for full view
                                          window.open(getFileUrl(attachment.url), "_blank");
                                        }}
                                      />
                                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          className="h-6 w-6 p-0"
                                          onClick={() =>
                                            window.open(
                                              getFileUrl(attachment.url),
                                              "_blank"
                                            )
                                          }
                                        >
                                          <Download className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 p-2 bg-background/50 rounded border">
                                      <FileText className="h-4 w-4" />
                                      <span className="text-xs truncate">
                                        {attachment.name}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() =>
                                          window.open(getFileUrl(attachment.url), "_blank")
                                        }
                                      >
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                        <div className="flex items-center justify-end mt-1">
                          {message.isOwn && (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs">✓</span>
                              {message.isRead && (
                                <span className="text-xs text-primary-foreground/70">
                                  ✓
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">
                          {typingUsers.length === 1
                            ? `${typingUsers[0].name} is typing...`
                            : `${typingUsers
                                .map((u) => u.name)
                                .join(", ")} are typing...`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Message Input - Only show if there's an active chat request */}
            {currentChatRequest && currentChatRequest.status === "active" && (
              <div className="p-4 border-t bg-white shadow-lg">
                {/* File previews */}
                {previewImages.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      Attachments:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {previewImages.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview.url}
                            alt={`Preview ${index + 1}`}
                            className="w-16 h-16 object-cover rounded border"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    title="Attach file"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    title="Add emoji"
                    onClick={handleEmojiClick}
                  >
                    <Smile className="h-4 w-4" />
                  </Button>

                  <Input
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 text-sm"
                    disabled={currentChatRequest.status !== "active"}
                  />
                  <Button
                    onClick={handleSendMessage}
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={
                      (!newMessage.trim() && selectedFiles.length === 0) ||
                      currentChatRequest.status !== "active"
                    }
                    title="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {isTyping && (
                  <div className="text-xs text-muted-foreground mt-1">
                    You are typing...
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Admin Chat Panel */}
      {user?.role === "Admin" && (
        <AdminChatPanel
          isOpen={isAdminPanelOpen}
          onClose={() => setIsAdminPanelOpen(false)}
        />
      )}
    </div>
  );
};

export default FloatingChat;
