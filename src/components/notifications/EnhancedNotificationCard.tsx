import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X, 
  Clock,
  ShoppingCart,
  Store,
  DollarSign,
  Shield,
  Package,
  Users,
  Settings
} from 'lucide-react';
import { Notification } from '@/apis/notifications';

interface EnhancedNotificationCardProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onClear: (id: string) => void;
  isHighlighted?: boolean;
}

// Enhanced notification type mapping for better user understanding
const getNotificationInfo = (type: string) => {
  const typeMap: Record<string, {
    icon: React.ReactNode;
    color: string;
    category: string;
    userFriendlyType: string;
    description: string;
  }> = {
    'LOW_STOCK_ALERT': {
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-orange-600 bg-orange-100',
      category: 'Inventory',
      userFriendlyType: 'Low Stock Warning',
      description: 'A product is running low on stock'
    },
    'RESTOCK_REQUEST': {
      icon: <ShoppingCart className="w-5 h-5" />,
      color: 'text-blue-600 bg-blue-100',
      category: 'Restock',
      userFriendlyType: 'Restock Request',
      description: 'A shop has requested more products'
    },
    'RESTOCK_APPROVED': {
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-green-600 bg-green-100',
      category: 'Restock',
      userFriendlyType: 'Restock Approved',
      description: 'Your restock request has been approved'
    },
    'RESTOCK_REJECTED': {
      icon: <X className="w-5 h-5" />,
      color: 'text-red-600 bg-red-100',
      category: 'Restock',
      userFriendlyType: 'Restock Rejected',
      description: 'Your restock request was not approved'
    },
    'INVENTORY_ADD_REQUEST': {
      icon: <Package className="w-5 h-5" />,
      color: 'text-purple-600 bg-purple-100',
      category: 'Inventory',
      userFriendlyType: 'Inventory Add Request',
      description: 'A request to add inventory has been made'
    },
    'SHOP_CREATED': {
      icon: <Store className="w-5 h-5" />,
      color: 'text-indigo-600 bg-indigo-100',
      category: 'Shop Management',
      userFriendlyType: 'New Shop Created',
      description: 'A new shop has been added to the system'
    },
    'MANAGER_ASSIGNED': {
      icon: <Users className="w-5 h-5" />,
      color: 'text-cyan-600 bg-cyan-100',
      category: 'Shop Management',
      userFriendlyType: 'Manager Assigned',
      description: 'A manager has been assigned to a shop'
    },
    'BILLING_CREATED': {
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-emerald-600 bg-emerald-100',
      category: 'Billing',
      userFriendlyType: 'New Invoice',
      description: 'A new invoice has been created'
    },
    'SYSTEM_ALERT': {
      icon: <Settings className="w-5 h-5" />,
      color: 'text-gray-600 bg-gray-100',
      category: 'System',
      userFriendlyType: 'System Alert',
      description: 'A system notification'
    },
    'SECURITY_ALERT': {
      icon: <Shield className="w-5 h-5" />,
      color: 'text-red-600 bg-red-100',
      category: 'Security',
      userFriendlyType: 'Security Alert',
      description: 'A security-related notification'
    }
  };

  return typeMap[type] || {
    icon: <Bell className="w-5 h-5" />,
    color: 'text-gray-600 bg-gray-100',
    category: 'General',
    userFriendlyType: type.replace(/_/g, ' '),
    description: 'A notification from the system'
  };
};

// Priority color mapping
const getPriorityColor = (priority?: string) => {
  const priorityMap: Record<string, string> = {
    'LOW': 'text-gray-600 bg-gray-100',
    'MEDIUM': 'text-yellow-600 bg-yellow-100',
    'HIGH': 'text-orange-600 bg-orange-100',
    'CRITICAL': 'text-red-600 bg-red-100'
  };
  return priorityMap[priority || 'LOW'] || 'text-gray-600 bg-gray-100';
};

// Helper function to get priority from notification type
const getPriorityFromType = (type: string): string => {
  const priorityMap: Record<string, string> = {
    'LOW_STOCK_ALERT': 'high',
    'SECURITY_ALERT': 'high',
    'RESTOCK_REQUEST': 'medium',
    'RESTOCK_APPROVED': 'medium',
    'RESTOCK_REJECTED': 'medium',
    'INVENTORY_ADD_REQUEST': 'medium',
    'SHOP_CREATED': 'low',
    'MANAGER_ASSIGNED': 'low',
    'BILLING_CREATED': 'low',
    'SYSTEM_ALERT': 'low'
  };
  return priorityMap[type] || 'medium';
};

// Time formatting for better readability
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
  
  return date.toLocaleDateString();
};

export const EnhancedNotificationCard: React.FC<EnhancedNotificationCardProps> = ({
  notification,
  onMarkRead,
  onClear,
  isHighlighted = false
}) => {
  const notificationInfo = getNotificationInfo(notification.type);
  const priority = getPriorityFromType(notification.type);
  const priorityColor = getPriorityColor(priority);

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md ${
        !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : 'bg-white'
      } ${isHighlighted ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon and Status */}
          <div className="flex-shrink-0">
            <div className={`p-2 rounded-full ${notificationInfo.color}`}>
              {notificationInfo.icon}
            </div>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mt-2 animate-pulse" />
            )}
            {isHighlighted && (
              <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mt-2 animate-bounce" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={notificationInfo.color}>
                  {notificationInfo.userFriendlyType}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {notificationInfo.category}
                </Badge>
                <Badge variant="outline" className={priorityColor}>
                  {priority}
                </Badge>
                {!notification.isRead && (
                  <Badge variant="default" className="bg-blue-500 text-white text-xs animate-pulse">
                    New
                  </Badge>
                )}
                {isHighlighted && (
                  <Badge variant="default" className="bg-blue-500 text-white text-xs animate-pulse">
                    You're here!
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{formatTime(notification.createdAt)}</span>
              </div>
            </div>
            
            {/* Title */}
            {(notification as any).title && (
              <h4 className="font-semibold text-gray-900 mb-2">
                {(notification as any).title}
              </h4>
            )}
            
            {/* Message */}
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
              {notification.message}
            </p>
            
            {/* Description */}
            <p className="text-gray-500 text-xs mb-3">
              {notificationInfo.description}
            </p>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {!notification.isRead && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMarkRead(notification.id)}
                  className="text-xs"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Mark as Read
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onClear(notification.id)}
                className="text-xs text-gray-500 hover:text-red-600"
              >
                <X className="w-3 h-3 mr-1" />
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedNotificationCard;
