export interface Notification {
  id: string;
  type: 'restock' | 'payment' | 'adjustment' | 'chat' | 'discount' | 'alert' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  category: 'request' | 'approval' | 'rejection' | 'alert' | 'info' | 'success' | 'warning' | 'error';
  userId: string;
  shopId?: string;
  relatedId?: string; // ID of related entity (request, payment, etc.)
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  readAt?: Date;
  archivedAt?: Date;
}

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
  restockRequests: boolean;
  paymentUpdates: boolean;
  stockAlerts: boolean;
  chatMessages: boolean;
  systemUpdates: boolean;
  marketing: boolean;
}

export interface NotificationFilter {
  type?: Notification['type'];
  priority?: Notification['priority'];
  status?: Notification['status'];
  category?: Notification['category'];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
}

export class NotificationService {
  private static notifications: Notification[] = [];
  private static preferences: NotificationPreferences[] = [];

  /**
   * Create a new notification
   */
  static async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      createdAt: new Date()
    };

    this.notifications.push(newNotification);
    
    // In a real application, this would save to the backend
    await this.saveNotification(newNotification);
    
    // Send real-time notification if user is online
    await this.sendRealTimeNotification(newNotification);
    
    return newNotification;
  }

  /**
   * Get notifications for a user
   */
  static async getNotifications(
    userId: string, 
    filter?: NotificationFilter,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    let filtered = this.notifications.filter(n => n.userId === userId);

    if (filter) {
      if (filter.type) {
        filtered = filtered.filter(n => n.type === filter.type);
      }
      if (filter.priority) {
        filtered = filtered.filter(n => n.priority === filter.priority);
      }
      if (filter.status) {
        filtered = filtered.filter(n => n.status === filter.status);
      }
      if (filter.category) {
        filtered = filtered.filter(n => n.category === filter.category);
      }
      if (filter.dateRange) {
        filtered = filtered.filter(n => 
          n.createdAt >= filter.dateRange!.start && 
          n.createdAt <= filter.dateRange!.end
        );
      }
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filtered = filtered.filter(n => 
          n.title.toLowerCase().includes(searchLower) ||
          n.message.toLowerCase().includes(searchLower)
        );
      }
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return filtered.slice(offset, offset + limit);
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && notification.status === 'unread') {
      notification.status = 'read';
      notification.readAt = new Date();
      await this.saveNotification(notification);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    const userNotifications = this.notifications.filter(n => 
      n.userId === userId && n.status === 'unread'
    );
    
    for (const notification of userNotifications) {
      notification.status = 'read';
      notification.readAt = new Date();
      await this.saveNotification(notification);
    }
  }

  /**
   * Archive notification
   */
  static async archiveNotification(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.status = 'archived';
      notification.archivedAt = new Date();
      await this.saveNotification(notification);
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index > -1) {
      this.notifications.splice(index, 1);
      await this.deleteNotificationFromBackend(notificationId);
    }
  }

  /**
   * Get notification statistics for a user
   */
  static async getNotificationStats(userId: string): Promise<NotificationStats> {
    const userNotifications = this.notifications.filter(n => n.userId === userId);
    
    const stats: NotificationStats = {
      total: userNotifications.length,
      unread: userNotifications.filter(n => n.status === 'unread').length,
      byType: {},
      byPriority: {},
      byCategory: {}
    };

    // Count by type
    userNotifications.forEach(n => {
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
    });

    // Count by priority
    userNotifications.forEach(n => {
      stats.byPriority[n.priority] = (stats.byPriority[n.priority] || 0) + 1;
    });

    // Count by category
    userNotifications.forEach(n => {
      stats.byCategory[n.category] = (stats.byCategory[n.category] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get user notification preferences
   */
  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    let preferences = this.preferences.find(p => p.userId === userId);
    
    if (!preferences) {
      // Default preferences
      preferences = {
        userId,
        email: true,
        push: true,
        inApp: true,
        restockRequests: true,
        paymentUpdates: true,
        stockAlerts: true,
        chatMessages: true,
        systemUpdates: true,
        marketing: false
      };
      this.preferences.push(preferences);
    }
    
    return preferences;
  }

  /**
   * Update notification preferences
   */
  static async updateNotificationPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    let userPreferences = this.preferences.find(p => p.userId === userId);
    
    if (!userPreferences) {
      userPreferences = await this.getNotificationPreferences(userId);
    }
    
    Object.assign(userPreferences, preferences);
    await this.saveNotificationPreferences(userPreferences);
  }

  /**
   * Create restock request notification
   */
  static async createRestockRequestNotification(
    shopOwnerId: string,
    requestId: string,
    shopName: string,
    productName: string,
    quantity: number,
    amount: number
  ): Promise<Notification> {
    return this.createNotification({
      type: 'restock',
      title: 'New Restock Request',
      message: `${shopName} requested ${quantity} units of ${productName} (₹${amount.toLocaleString()})`,
      priority: 'medium',
      status: 'unread',
      category: 'request',
      userId: 'admin', // Notify admin
      shopId: shopOwnerId,
      relatedId: requestId,
      actionUrl: '/admin/requests',
      actionText: 'View Request',
      metadata: {
        shopName,
        productName,
        quantity,
        amount
      }
    });
  }

  /**
   * Create payment verification notification
   */
  static async createPaymentVerificationNotification(
    shopOwnerId: string,
    paymentId: string,
    amount: number,
    status: 'verified' | 'rejected'
  ): Promise<Notification> {
    const isVerified = status === 'verified';
    
    return this.createNotification({
      type: 'payment',
      title: isVerified ? 'Payment Verified' : 'Payment Rejected',
      message: `Your payment of ₹${amount.toLocaleString()} has been ${isVerified ? 'verified' : 'rejected'}`,
      priority: isVerified ? 'medium' : 'high',
      status: 'unread',
      category: isVerified ? 'success' : 'rejection',
      userId: shopOwnerId,
      relatedId: paymentId,
      actionUrl: '/payments',
      actionText: 'View Payment',
      metadata: {
        amount,
        status
      }
    });
  }

  /**
   * Create stock adjustment notification
   */
  static async createStockAdjustmentNotification(
    shopOwnerId: string,
    adjustmentId: string,
    productName: string,
    status: 'approved' | 'rejected'
  ): Promise<Notification> {
    const isApproved = status === 'approved';
    
    return this.createNotification({
      type: 'adjustment',
      title: isApproved ? 'Stock Adjustment Approved' : 'Stock Adjustment Rejected',
      message: `Your stock adjustment request for ${productName} has been ${isApproved ? 'approved' : 'rejected'}`,
      priority: 'medium',
      status: 'unread',
      category: isApproved ? 'approval' : 'rejection',
      userId: shopOwnerId,
      relatedId: adjustmentId,
      actionUrl: '/inventory/adjustments',
      actionText: 'View Adjustment',
      metadata: {
        productName,
        status
      }
    });
  }

  /**
   * Create low stock alert notification
   */
  static async createLowStockAlertNotification(
    shopOwnerId: string,
    productId: string,
    productName: string,
    currentStock: number,
    minStock: number,
    percentage: number
  ): Promise<Notification> {
    const priority = percentage <= 20 ? 'urgent' : percentage <= 40 ? 'high' : 'medium';
    
    return this.createNotification({
      type: 'alert',
      title: 'Low Stock Alert',
      message: `${productName} is running low (${currentStock}/${minStock} units, ${percentage}%)`,
      priority,
      status: 'unread',
      category: 'alert',
      userId: shopOwnerId,
      shopId: shopOwnerId,
      relatedId: productId,
      actionUrl: '/inventory/restock',
      actionText: 'Restock Now',
      metadata: {
        productName,
        currentStock,
        minStock,
        percentage
      }
    });
  }

  /**
   * Create chat message notification
   */
  static async createChatMessageNotification(
    recipientId: string,
    senderName: string,
    message: string,
    chatRequestId: string
  ): Promise<Notification> {
    return this.createNotification({
      type: 'chat',
      title: `New message from ${senderName}`,
      message: message.length > 100 ? message.substring(0, 100) + '...' : message,
      priority: 'medium',
      status: 'unread',
      category: 'info',
      userId: recipientId,
      relatedId: chatRequestId,
      actionUrl: '/chat',
      actionText: 'View Chat',
      metadata: {
        senderName,
        message
      }
    });
  }

  /**
   * Create discount code notification
   */
  static async createDiscountCodeNotification(
    userId: string,
    code: string,
    discountValue: string,
    validUntil: Date
  ): Promise<Notification> {
    return this.createNotification({
      type: 'discount',
      title: 'New Discount Code Available',
      message: `Use code "${code}" for ${discountValue} off. Valid until ${validUntil.toLocaleDateString()}`,
      priority: 'low',
      status: 'unread',
      category: 'info',
      userId,
      actionUrl: '/discounts',
      actionText: 'View Discounts',
      metadata: {
        code,
        discountValue,
        validUntil
      }
    });
  }

  /**
   * Create system notification
   */
  static async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    priority: Notification['priority'] = 'medium',
    category: Notification['category'] = 'info'
  ): Promise<Notification> {
    return this.createNotification({
      type: 'system',
      title,
      message,
      priority,
      status: 'unread',
      category,
      userId,
      actionUrl: '/notifications',
      actionText: 'View Details'
    });
  }

  /**
   * Send real-time notification via WebSocket
   */
  private static async sendRealTimeNotification(notification: Notification): Promise<void> {
    // In a real application, this would send via WebSocket
    console.log('Sending real-time notification:', notification);
  }

  /**
   * Save notification to backend
   */
  private static async saveNotification(notification: Notification): Promise<void> {
    // In a real application, this would save to your backend
    console.log('Saving notification:', notification);
  }

  /**
   * Delete notification from backend
   */
  private static async deleteNotificationFromBackend(notificationId: string): Promise<void> {
    // In a real application, this would delete from your backend
    console.log('Deleting notification:', notificationId);
  }

  /**
   * Save notification preferences to backend
   */
  private static async saveNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
    // In a real application, this would save to your backend
    console.log('Saving notification preferences:', preferences);
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get notification icon
   */
  static getNotificationIcon(type: Notification['type']): string {
    const icons = {
      restock: '📦',
      payment: '💳',
      adjustment: '📊',
      chat: '💬',
      discount: '🎟️',
      alert: '⚠️',
      system: '🔔'
    };
    return icons[type] || '🔔';
  }

  /**
   * Get notification color
   */
  static getNotificationColor(priority: Notification['priority']): string {
    const colors = {
      low: 'text-gray-600 bg-gray-50 border-gray-200',
      medium: 'text-blue-600 bg-blue-50 border-blue-200',
      high: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      urgent: 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[priority];
  }

  /**
   * Format notification time
   */
  static formatNotificationTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  }
}

export default NotificationService;
