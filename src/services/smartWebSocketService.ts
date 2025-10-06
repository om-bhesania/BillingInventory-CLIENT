import { getWebSocketService } from './websocketService';

export interface WebSocketMessage {
  id: string;
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  requiresAck: boolean;
  batchable: boolean;
}

export interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number;
  priorityThreshold: 'critical' | 'high' | 'medium' | 'low';
}

export interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  lastConnected: Date | null;
  lastDisconnected: Date | null;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  latency: number;
}

export interface SmartWebSocketState {
  connectionStatus: ConnectionStatus;
  messageQueue: WebSocketMessage[];
  batchQueue: WebSocketMessage[];
  pendingAcks: Map<string, WebSocketMessage>;
  isBatching: boolean;
  isProcessing: boolean;
  error: string | null;
  stats: {
    messagesSent: number;
    messagesReceived: number;
    messagesFailed: number;
    batchesProcessed: number;
    averageLatency: number;
  };
}

class SmartWebSocketService {
  private wsService = getWebSocketService();
  private state: SmartWebSocketState = {
    connectionStatus: {
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      lastConnected: null,
      lastDisconnected: null,
      connectionQuality: 'disconnected',
      latency: 0
    },
    messageQueue: [],
    batchQueue: [],
    pendingAcks: new Map(),
    isBatching: false,
    isProcessing: false,
    error: null,
    stats: {
      messagesSent: 0,
      messagesReceived: 0,
      messagesFailed: 0,
      batchesProcessed: 0,
      averageLatency: 0
    }
  };

  private listeners: Set<(state: SmartWebSocketState) => void> = new Set();
  private batchTimer: NodeJS.Timeout | null = null;
  private processTimer: NodeJS.Timeout | null = null;
  private latencyTimer: NodeJS.Timeout | null = null;
  private batchConfig: BatchConfig = {
    maxBatchSize: 10,
    maxWaitTime: 100, // 100ms
    priorityThreshold: 'medium'
  };

  constructor() {
    this.initializeWebSocketListeners();
    this.startLatencyMonitoring();
  }

  private initializeWebSocketListeners() {
    // Connection status
    this.wsService.on('connected', () => {
      this.updateConnectionStatus({
        isConnected: true,
        isConnecting: false,
        reconnectAttempts: 0,
        lastConnected: new Date(),
        connectionQuality: 'excellent'
      });
      this.startProcessing();
    });

    this.wsService.on('disconnected', () => {
      this.updateConnectionStatus({
        isConnected: false,
        isConnecting: false,
        lastDisconnected: new Date(),
        connectionQuality: 'disconnected'
      });
      this.stopProcessing();
    });

    this.wsService.on('connection:error', (error: any) => {
      this.updateConnectionStatus({
        isConnecting: false,
        reconnectAttempts: this.state.connectionStatus.reconnectAttempts + 1
      });
      this.updateState({ error: error.message || 'Connection error' });
    });

    // Message acknowledgments
    this.wsService.on('message:ack', (data: { messageId: string, timestamp: number }) => {
      this.handleMessageAck(data.messageId, data.timestamp);
    });

    // Message responses
    this.wsService.on('message:response', (data: { messageId: string, response: any }) => {
      this.handleMessageResponse(data.messageId, data.response);
    });

    // Error responses
    this.wsService.on('message:error', (data: { messageId: string, error: string }) => {
      this.handleMessageError(data.messageId, data.error);
    });
  }

  private updateConnectionStatus(updates: Partial<ConnectionStatus>) {
    this.state.connectionStatus = { ...this.state.connectionStatus, ...updates };
    this.notifyListeners();
  }

  private updateState(updates: Partial<SmartWebSocketState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  private startLatencyMonitoring() {
    this.latencyTimer = setInterval(() => {
      if (this.state.connectionStatus.isConnected) {
        this.measureLatency();
      }
    }, 5000); // Measure latency every 5 seconds
  }

  private measureLatency() {
    const startTime = Date.now();
    this.wsService.emit('ping', { timestamp: startTime });
    
    // Listen for pong response
    const handlePong = (data: { timestamp: number }) => {
      const latency = Date.now() - data.timestamp;
      this.updateConnectionStatus({ latency });
      
      // Update connection quality based on latency
      let quality: 'excellent' | 'good' | 'poor' | 'disconnected' = 'excellent';
      if (latency > 1000) quality = 'poor';
      else if (latency > 500) quality = 'good';
      
      this.updateConnectionStatus({ connectionQuality: quality });
      
      // Update average latency
      const newAverage = (this.state.stats.averageLatency + latency) / 2;
      this.updateState({
        stats: { ...this.state.stats, averageLatency: newAverage }
      });
      
      this.wsService.off('pong', handlePong);
    };
    
    this.wsService.on('pong', handlePong);
  }

  private startProcessing() {
    if (this.state.isProcessing) return;
    
    this.updateState({ isProcessing: true });
    this.processMessages();
  }

  private stopProcessing() {
    this.updateState({ isProcessing: false });
    if (this.processTimer) {
      clearTimeout(this.processTimer);
      this.processTimer = null;
    }
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  private processMessages() {
    if (!this.state.connectionStatus.isConnected || !this.state.isProcessing) return;

    // Process high priority messages immediately
    const highPriorityMessages = this.state.messageQueue.filter(
      msg => msg.priority === 'critical' || msg.priority === 'high'
    );

    highPriorityMessages.forEach(message => {
      this.sendMessage(message);
    });

    // Remove processed high priority messages
    this.state.messageQueue = this.state.messageQueue.filter(
      msg => msg.priority !== 'critical' && msg.priority !== 'high'
    );

    // Process batchable messages
    this.processBatchableMessages();

    // Schedule next processing cycle
    this.processTimer = setTimeout(() => {
      this.processMessages();
    }, 50); // Process every 50ms
  }

  private processBatchableMessages() {
    const batchableMessages = this.state.messageQueue.filter(
      msg => msg.batchable && this.shouldBatch(msg.priority)
    );

    if (batchableMessages.length === 0) return;

    // Add to batch queue
    this.state.batchQueue.push(...batchableMessages);

    // Remove from main queue
    this.state.messageQueue = this.state.messageQueue.filter(
      msg => !msg.batchable || !this.shouldBatch(msg.priority)
    );

    // Process batch if conditions are met
    if (this.shouldProcessBatch()) {
      this.processBatch();
    } else if (!this.state.isBatching) {
      // Start batch timer
      this.state.isBatching = true;
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.batchConfig.maxWaitTime);
    }
  }

  private shouldBatch(priority: string): boolean {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const thresholdOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    
    return priorityOrder[priority as keyof typeof priorityOrder] <= 
           thresholdOrder[this.batchConfig.priorityThreshold];
  }

  private shouldProcessBatch(): boolean {
    return this.state.batchQueue.length >= this.batchConfig.maxBatchSize;
  }

  private processBatch() {
    if (this.state.batchQueue.length === 0) return;

    const batch = this.state.batchQueue.splice(0, this.batchConfig.maxBatchSize);
    
    // Send batch
    this.wsService.emit('batch:message', {
      messages: batch.map(msg => ({
        id: msg.id,
        type: msg.type,
        data: msg.data,
        timestamp: msg.timestamp
      })),
      batchId: `batch-${Date.now()}`,
      count: batch.length
    });

    // Update stats
    this.updateState({
      stats: {
        ...this.state.stats,
        messagesSent: this.state.stats.messagesSent + batch.length,
        batchesProcessed: this.state.stats.batchesProcessed + 1
      }
    });

    // Clear batch timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    this.state.isBatching = false;
  }

  private sendMessage(message: WebSocketMessage) {
    if (!this.state.connectionStatus.isConnected) {
      this.queueMessage(message);
      return;
    }

    try {
      this.wsService.emit(message.type, {
        id: message.id,
        data: message.data,
        timestamp: message.timestamp,
        requiresAck: message.requiresAck
      });

      // Track message if it requires acknowledgment
      if (message.requiresAck) {
        this.state.pendingAcks.set(message.id, message);
      }

      // Update stats
      this.updateState({
        stats: {
          ...this.state.stats,
          messagesSent: this.state.stats.messagesSent + 1
        }
      });

    } catch (error) {
      console.error('Error sending message:', error);
      this.handleMessageError(message.id, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private queueMessage(message: WebSocketMessage) {
    // Add to queue with priority ordering
    const insertIndex = this.findInsertIndex(message);
    this.state.messageQueue.splice(insertIndex, 0, message);
    this.notifyListeners();
  }

  private findInsertIndex(message: WebSocketMessage): number {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const messagePriority = priorityOrder[message.priority];
    
    for (let i = 0; i < this.state.messageQueue.length; i++) {
      const queuePriority = priorityOrder[this.state.messageQueue[i].priority];
      if (messagePriority > queuePriority) {
        return i;
      }
    }
    
    return this.state.messageQueue.length;
  }

  private handleMessageAck(messageId: string, timestamp: number) {
    const message = this.state.pendingAcks.get(messageId);
    if (message) {
      this.state.pendingAcks.delete(messageId);
      
      // Calculate round-trip time
      const rtt = Date.now() - message.timestamp.getTime();
      const newAverage = (this.state.stats.averageLatency + rtt) / 2;
      
      this.updateState({
        stats: {
          ...this.state.stats,
          averageLatency: newAverage
        }
      });
    }
  }

  private handleMessageResponse(messageId: string, response: any) {
    this.state.pendingAcks.delete(messageId);
    this.updateState({
      stats: {
        ...this.state.stats,
        messagesReceived: this.state.stats.messagesReceived + 1
      }
    });
  }

  private handleMessageError(messageId: string, error: string) {
    const message = this.state.pendingAcks.get(messageId);
    if (message) {
      this.state.pendingAcks.delete(messageId);
      
      // Retry if within limits
      if (message.retryCount < message.maxRetries) {
        message.retryCount++;
        this.queueMessage(message);
      } else {
        this.updateState({
          stats: {
            ...this.state.stats,
            messagesFailed: this.state.stats.messagesFailed + 1
          }
        });
      }
    }
  }

  // Public API
  public subscribe(listener: (state: SmartWebSocketState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getState(): SmartWebSocketState {
    return { ...this.state };
  }

  public sendMessage(
    type: string,
    data: any,
    options: {
      priority?: 'critical' | 'high' | 'medium' | 'low';
      requiresAck?: boolean;
      batchable?: boolean;
      maxRetries?: number;
    } = {}
  ): string {
    const messageId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const message: WebSocketMessage = {
      id: messageId,
      type,
      priority: options.priority || 'medium',
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      requiresAck: options.requiresAck || false,
      batchable: options.batchable || false
    };

    if (this.state.connectionStatus.isConnected) {
      this.sendMessage(message);
    } else {
      this.queueMessage(message);
    }

    return messageId;
  }

  public sendBatchMessage(
    type: string,
    data: any[],
    options: {
      priority?: 'critical' | 'high' | 'medium' | 'low';
      requiresAck?: boolean;
    } = {}
  ): string[] {
    const messageIds: string[] = [];
    
    data.forEach(item => {
      const messageId = this.sendMessage(type, item, {
        ...options,
        batchable: true
      });
      messageIds.push(messageId);
    });

    return messageIds;
  }

  public setBatchConfig(config: Partial<BatchConfig>) {
    this.batchConfig = { ...this.batchConfig, ...config };
  }

  public getConnectionStatus(): ConnectionStatus {
    return { ...this.state.connectionStatus };
  }

  public getStats() {
    return { ...this.state.stats };
  }

  public clearQueue() {
    this.state.messageQueue = [];
    this.state.batchQueue = [];
    this.state.pendingAcks.clear();
    this.notifyListeners();
  }

  public retryFailedMessages() {
    const failedMessages = Array.from(this.state.pendingAcks.values())
      .filter(msg => msg.retryCount < msg.maxRetries);
    
    failedMessages.forEach(message => {
      this.state.pendingAcks.delete(message.id);
      this.queueMessage(message);
    });
  }

  public disconnect() {
    this.stopProcessing();
    this.wsService.disconnect();
  }

  public connect() {
    this.wsService.connect();
  }
}

// Singleton instance
let smartWebSocketService: SmartWebSocketService | null = null;

export const getSmartWebSocketService = (): SmartWebSocketService => {
  if (!smartWebSocketService) {
    smartWebSocketService = new SmartWebSocketService();
  }
  return smartWebSocketService;
};

export default SmartWebSocketService;
