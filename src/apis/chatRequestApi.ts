import { API_URL } from "@/services/apiuri";
import { service } from "@/services/service";

export interface ChatRequest {
  id: string;
  shopOwnerId: string;
  adminId?: string;
  status: 'pending' | 'active' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  subject?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  shopOwner: {
    id: string;
    name: string;
    email: string;
    publicId: string;
    role: string;
  };
  admin?: {
    id: string;
    name: string;
    email: string;
    publicId: string;
  };
  messages: Array<{
    id: string;
    message: string;
    timestamp: string;
    isRead: boolean;
  }>;
  _count: {
    messages: number;
  };
}

export interface CreateChatRequestData {
  subject?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface ChatRequestFilters {
  status?: 'pending' | 'active' | 'closed';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export const chatRequestApi = {
  // Create a new chat request
  createChatRequest: async (data: CreateChatRequestData): Promise<{ success: boolean; data: ChatRequest }> => {
    const response = await service({
      url: API_URL.chatRequests.create,
      method: 'POST',
      data
    });
    return response;
  },

  // Get all chat requests
  getChatRequests: async (filters?: ChatRequestFilters): Promise<{ success: boolean; data: ChatRequest[] }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    
    const response = await service({
      url: `${API_URL.chatRequests.list}?${params.toString()}`,
      method: 'GET'
    });
    return response;
  },

  // Get specific chat request details
  getChatRequestDetails: async (requestId: string): Promise<{ success: boolean; data: ChatRequest }> => {
    const response = await service({
      url: `${API_URL.chatRequests.details}/${requestId}`,
      method: 'GET'
    });
    return response;
  },

  // Assign chat request to admin
  assignChatRequest: async (requestId: string, adminId: string): Promise<{ success: boolean; data: ChatRequest }> => {
    const response = await service({
      url: `${API_URL.chatRequests.assign}/${requestId}/assign`,
      method: 'PATCH',
      data: { adminId }
    });
    return response;
  },

  // Close chat request
  closeChatRequest: async (requestId: string): Promise<{ success: boolean; data: ChatRequest }> => {
    const response = await service({
      url: `${API_URL.chatRequests.close}/${requestId}/close`,
      method: 'PATCH'
    });
    return response;
  },

  // Delete closed chat request
  deleteChatRequest: async (requestId: string): Promise<{ success: boolean; message: string }> => {
    const response = await service({
      url: `${API_URL.chatRequests.delete}/${requestId}`,
      method: 'DELETE'
    });
    return response;
  }
};

export default chatRequestApi;
