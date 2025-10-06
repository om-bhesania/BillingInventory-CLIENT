import { API_URL } from "@/services/apiuri";
import { service } from "@/services/service";

export interface ChatMessage {
  id: string;
  message: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  timestamp: string;
  isRead: boolean;
  room: string;
}

export interface ChatRoom {
  room: string;
  user: {
    id: string;
    name: string;
    role: string;
    publicId: string;
  } | null;
  latestMessage?: string;
  latestMessageTime?: string;
  messageCount: number;
  unreadCount: number;
}

export interface SendMessageRequest {
  message: string;
  room: string;
}

export interface GetChatMessagesRequest {
  room: string;
  limit?: number;
  offset?: number;
}

export interface GetChatRoomsRequest {
  role?: string;
}

export interface MarkAsReadRequest {
  room: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

// Get chat messages for a specific room
export const getChatMessages = async (data: GetChatMessagesRequest): Promise<ChatMessage[]> => {
  const { room, limit = 50, offset = 0 } = data;
  const response = await service<ChatMessage[]>({
    url: `${API_URL.chat.messages(room)}?limit=${limit}&offset=${offset}`,
    method: "GET",
  });
  return response;
};

// Send a chat message
export const sendMessage = async (data: SendMessageRequest): Promise<ChatMessage> => {
  const response = await service<ChatMessage>({
    url: API_URL.chat.send,
    method: "POST",
    data,
  });
  return response;
};

// Get all chat rooms (admin only)
export const getChatRooms = async (data?: GetChatRoomsRequest): Promise<ChatRoom[]> => {
  const params = data?.role ? `?role=${data.role}` : '';
  const response = await service<ChatRoom[]>({
    url: `${API_URL.chat.rooms}${params}`,
    method: "GET",
  });
  return response;
};

// Mark messages as read
export const markAsRead = async (data: MarkAsReadRequest): Promise<void> => {
  await service<void>({
    url: API_URL.chat.read(data.room),
    method: "PUT",
  });
};

// Get unread message count
export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  const response = await service<UnreadCountResponse>({
    url: API_URL.chat.unreadCount,
    method: "GET",
  });
  return response;
};
