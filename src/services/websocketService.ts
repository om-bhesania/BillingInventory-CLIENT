  import { io, Socket } from 'socket.io-client';

interface WebSocketService {
  connect(): void;
  disconnect(): void;
  on(event: string, callback: (data: any) => void): void;
  off(event: string, callback: (data: any) => void): void;
  emit(event: string, data: any): void;
  markNotificationAsRead(notificationId: string): void;
  startTyping(room: string): void;
  stopTyping(room: string): void;
  sendChatMessage(message: string, room: string): void;
  markMessageAsRead(messageId: string): void;
  joinRoom(room: string): void;
  leaveRoom(room: string): void;
  subscribeToLiveData(type: string): void;
  unsubscribeFromLiveData(type: string): void;
  updatePageNavigation(page: string): void;
  sendFormUpdate(formId: string, field: string, value: any): void;
  startEditing(documentId: string, field: string): void;
  stopEditing(documentId: string, field: string): void;
  ping(): void;
  isConnected: boolean;
  getConnectionStatus(): any;
  reconnect(): void;
  shouldReconnect(): boolean;
  refreshConnection(): void;
}

class WebSocketServiceImpl implements WebSocketService {
  private socket: Socket | null = null;
  public isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10; // Increased attempts
  private reconnectDelay: number = 1000;
  private maxReconnectDelay: number = 30000; // 30 seconds max delay
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnecting: boolean = false;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Don't connect immediately - wait for token to be available
    this.initializeConnection();
  }

  private initializeConnection(): void {
    // Check if we have a token, if not, wait for it
    const token = this.getToken();
    if (token) {
      this.connect();
    } else {
      // Wait for token to be available (poll every 500ms for max 10 seconds)
      let attempts = 0;
      const maxAttempts = 20; // 10 seconds total
      
      const checkToken = () => {
        attempts++;
        const currentToken = this.getToken();
        
        if (currentToken) {
          this.connect();
        } else if (attempts < maxAttempts) {
          setTimeout(checkToken, 500);
        } else {
          console.warn('No token found after 10 seconds, WebSocket will not connect');
          this.emit('connection:status', { 
            connected: false, 
            attempts: 0, 
            error: 'No authentication token available' 
          });
        }
      };
      
      checkToken();
    }
  }

  connect(): void {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting || this.isConnected) {
      return;
    }

    const token = this.getToken();
    // Use the base server URL for Socket.IO (without /api path)
    // Socket.IO needs the base server URL, not the API endpoint
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const serverUrl = baseUrl.replace('/api', '');
    
    if (!token) {
      console.warn('No token found, cannot connect to WebSocket.');
      this.emit('connection:status', { 
        connected: false, 
        attempts: this.reconnectAttempts, 
        error: 'No token' 
      });
      return;
    }

    this.isConnecting = true;
    
    console.log('WebSocket connection attempt:', { 
      hasToken: !!token, 
      serverUrl,
      tokenLength: token?.length || 0,
      attempt: this.reconnectAttempts + 1,
      env: {
        VITE_API_URL: import.meta.env.VITE_API_URL,
        NODE_ENV: import.meta.env.NODE_ENV,
        MODE: import.meta.env.MODE
      }
    });

    // Clear any existing connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }

    // Set connection timeout
    this.connectionTimeout = setTimeout(() => {
      if (this.isConnecting) {
        console.error('WebSocket connection timeout');
        this.isConnecting = false;
        this.handleConnectionError(new Error('Connection timeout'));
      }
    }, 15000); // 15 second timeout

    console.log('Creating Socket.IO connection to:', serverUrl);
    
    this.socket = io(serverUrl, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 0, // We'll handle reconnection manually
      reconnectionDelay: 0,
      reconnectionDelayMax: 0,
      timeout: 10000,
      forceNew: true,
      autoConnect: true,
      // Use the correct path for Socket.IO
      path: '/socket.io/',
      // Enable credentials for CORS
      withCredentials: true
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected successfully');
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      this.emit('connection:status', { 
        connected: true, 
        attempts: 0, 
        socketId: this.socket?.id 
      });
      
      // Start health check
      this.startHealthCheck();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.isConnecting = false;
      
      // Stop health check
      this.stopHealthCheck();
      
      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      this.emit('connection:status', { 
        connected: false, 
        reason,
        socketId: this.socket?.id 
      });
      
      // Attempt reconnection if it wasn't a manual disconnect
      if (reason !== 'io client disconnect' && this.shouldReconnect()) {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
      this.isConnecting = false;
      this.reconnectAttempts++;
      
      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      // Add specific error handling for ECONNABORTED
      if (error.message?.includes('ECONNABORTED') || error.type === 'TransportError') {
        console.warn('Connection aborted, will retry with exponential backoff');
        this.handleConnectionError({
          ...error,
          message: 'Connection was interrupted, retrying...',
          type: 'ConnectionAborted'
        });
      } else {
        this.handleConnectionError(error);
      }
    });

    // Set up event forwarding
    this.setupEventForwarding();
  }

  private setupEventForwarding(): void {
    if (!this.socket) return;

    // Forward all socket events to internal event system
    const events = [
      'notification:new',
      'notification:read:success',
      'notification:read:error',
      'notification:cleared',
      'notification:cleared_all',
      'connected',
      'presence:update',
      'user:typing',
      'chat:message:new',
      'chat_request_assigned',
      'chat_request_status_updated',
      'live:data',
      'system:health',
      'system:message',
      'restock:status:update',
      'restock_request_created',
      'restock_request_approved',
      'restock_request_rejected',
      'restock_request_status_updated',
      'restock_request_fulfilled',
      'restock_request_auto_generated',
      'restock_request_hidden',
      'inventory:update',
      'billing:update',
      'product:update',
      'shop:update',
      'dashboard:update',
      'low_stock:alert',
      'raw_material:low_stock',
      'form:sync',
      'edit:user:start',
      'edit:user:stop',
      'system:pong'
    ];

    events.forEach(event => {
      this.socket!.on(event, (data) => {
        this.emit(event, data);
      });
    });
  }

  disconnect(): void {
    // Clear all timeouts
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  markNotificationAsRead(notificationId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('notification:read', { notificationId });
    }
  }

  startTyping(room: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing:start', { room });
    }
  }

  stopTyping(room: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing:stop', { room });
    }
  }

  sendChatMessage(message: string, room: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('chat:message', { message, room });
    }
  }

  markMessageAsRead(messageId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('chat:message:read', { messageId });
    }
  }

  joinRoom(room: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('join:room', { room });
    }
  }

  leaveRoom(room: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave:room', { room });
    }
  }

  subscribeToLiveData(type: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('live:subscribe', { type });
    }
  }

  unsubscribeFromLiveData(type: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('live:unsubscribe', { type });
    }
  }

  updatePageNavigation(page: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('page:navigate', { page });
    }
  }

  sendFormUpdate(formId: string, field: string, value: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('form:update', { formId, field, value });
    }
  }

  startEditing(documentId: string, field: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('edit:start', { documentId, field });
    }
  }

  stopEditing(documentId: string, field: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('edit:stop', { documentId, field });
    }
  }

  ping(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('system:ping');
    }
  }

  getConnectionStatus(): any {
    return {
      connected: this.isConnected,
      attempts: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      socketId: this.socket?.id || null,
      reconnecting: this.reconnectTimeout !== null,
      isConnecting: this.isConnecting
    };
  }

  private handleConnectionError(error: any): void {
    this.emit('connection:status', { 
      connected: false, 
      attempts: this.reconnectAttempts, 
      error: error.message || 'Connection failed',
      type: error.type,
      description: error.description
    });
    
    // Schedule reconnection if we haven't exceeded max attempts
    if (this.shouldReconnect()) {
      this.scheduleReconnect();
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('connection:status', { 
        connected: false, 
        attempts: this.reconnectAttempts, 
        failed: true,
        error: 'Max reconnection attempts reached'
      });
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    // Exponential backoff with jitter, but cap it for ECONNABORTED errors
    const baseDelay = this.reconnectDelay * Math.pow(2, Math.min(this.reconnectAttempts, 5));
    const jitter = Math.random() * 1000;
    const delay = Math.min(baseDelay + jitter, this.maxReconnectDelay);
    
    console.log(`Scheduling reconnection in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts + 1})`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.shouldReconnect()) {
        // Force a clean disconnect before reconnecting
        if (this.socket) {
          this.socket.removeAllListeners();
          this.socket.disconnect();
          this.socket = null;
        }
        this.connect();
      }
    }, delay);
  }

  // Manual reconnection method
  reconnect(): void {
    console.log('Manual reconnection requested');
    this.reconnectAttempts = 0; // Reset attempts for manual reconnect
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  // Check if we should attempt reconnection
  shouldReconnect(): boolean {
    return this.reconnectAttempts < this.maxReconnectAttempts;
  }

  private getToken(): string | null {
    return sessionStorage.getItem('auth_token') || localStorage.getItem('token');
  }

  // Method to refresh connection when token changes
  refreshConnection(): void {
    console.log('Refreshing WebSocket connection with new token');
    this.disconnect();
    this.reconnectAttempts = 0;
    this.initializeConnection();
  }

  private startHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(() => {
      if (this.isConnected && this.socket) {
        this.ping();
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Singleton instance
let webSocketService: WebSocketService | null = null;

export const getWebSocketService = (): WebSocketService => {
  if (!webSocketService) {
    webSocketService = new WebSocketServiceImpl();
  }
  return webSocketService;
};

export default WebSocketService;
