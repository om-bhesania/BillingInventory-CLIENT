import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Bell, 
  BellRing, 
  Check, 
  X, 
  Archive, 
  Trash2,
  Filter, 
  Search, 
  Settings,
  RefreshCw,
  MoreHorizontal,
  Eye,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Info,
  DollarSign,
  Package,
  MessageSquare,
  Gift,
  BarChart3
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationsContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface EnhancedNotificationTrayProps {
  className?: string;
  onNotificationClick?: (notification: any) => void;
}

export const EnhancedNotificationTray: React.FC<EnhancedNotificationTrayProps> = ({
  className,
  onNotificationClick
}) => {
  const { notifications, unreadCount, markRead, markAllRead, clearNotification, clearAllNotifications } = useNotifications();
  const { hasModuleAccess } = usePermissions();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filteredNotifications, setFilteredNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  useEffect(() => {
    applyFilters();
  }, [notifications, searchQuery, activeTab]);


  const applyFilters = () => {
    let filtered = [...notifications];

    // Apply tab filter
    if (activeTab !== 'all') {
      if (activeTab === 'unread') {
        filtered = filtered.filter(n => !n.isRead);
      } else {
        filtered = filtered.filter(n => n.type === activeTab);
      }
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.message.toLowerCase().includes(query)
      );
    }

    setFilteredNotifications(filtered);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await clearNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleBulkAction = async (action: 'read' | 'delete') => {
    try {
      for (const notificationId of selectedNotifications) {
        switch (action) {
          case 'read':
            await markRead(notificationId);
            break;
          case 'delete':
            await clearNotification(notificationId);
            break;
        }
      }
      setSelectedNotifications(new Set());
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, any> = {
      restock: Package,
      RESTOCK_REQUEST: Package,
      payment: DollarSign,
      adjustment: BarChart3,
      chat: MessageSquare,
      CHAT_MESSAGE: MessageSquare,
      discount: Gift,
      alert: AlertTriangle,
      system: Bell,
      inventory: Package,
      billing: DollarSign,
      product: Package,
      shop: Package,
      dashboard: BarChart3,
      lowStock: AlertTriangle
    };
    
    const Icon = icons[type] || Bell;
    return <Icon className="h-4 w-4" />;
  };

  const getNotificationColor = (isRead: boolean) => {
    return isRead 
      ? 'text-gray-600 bg-gray-50 border-gray-200'
      : 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getStatusIcon = (isRead: boolean) => {
    return isRead 
      ? <CheckCircle className="h-4 w-4 text-green-600" />
      : <div className="w-2 h-2 bg-blue-600 rounded-full" />;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Get notification route and check permissions
  const getNotificationRoute = (type?: string) => {
    switch (type) {
      case "LOW_STOCK_ALERT":
      case "lowStock":
        if (user?.role === "Shop Owner" || user?.role === "Shop_Owner") {
          return hasModuleAccess("Shop Inventory") ? "/shop-inventory" : null;
        }
        return hasModuleAccess("Low Stock Alerts") ? "/low-stock" : null;
      case "RESTOCK_REQUEST":
      case "RESTOCK_APPROVED":
      case "RESTOCK_REJECTED":
      case "RESTOCK_FULFILLED":
      case "RESTOCK_STATUS_UPDATED":
      case "INVENTORY_ADD_REQUEST":
      case "restock":
        return hasModuleAccess("Restock Management") ? "/restock-management" : null;
      case "PRODUCT_CREATED":
      case "PRODUCT_UPDATED":
      case "FLAVOR_CREATED":
      case "CATEGORY_CREATED":
      case "CATEGORY_UPDATED":
      case "CATEGORY_DEACTIVATED":
      case "product":
      case "inventory":
        return hasModuleAccess("Inventory") ? "/inventory" : null;
      case "CHAT_MESSAGE":
      case "CHAT_REQUEST":
      case "chat":
        return null; // Handle chat notifications specially - don't navigate
      case "payment":
      case "billing":
        return hasModuleAccess("Billing") ? "/billing" : null;
      case "shop":
        return hasModuleAccess("Shop Management") ? "/shop-management" : null;
      case "dashboard":
        return "/dashboard";
      case "discount":
        return hasModuleAccess("Discounts") ? "/discounts" : null;
      case "system":
        return "/notifications"; // Stay on notifications page for system
      default:
        return null;
    }
  };

  const handleNotificationClick = async (notification: any) => {
    try {
      // Handle chat notifications specially
      if (notification.type === 'CHAT_MESSAGE' || notification.type === 'CHAT_REQUEST') {
        // Don't mark as read automatically - let user decide
        // Trigger floating chat window
        window.dispatchEvent(new CustomEvent('open-floating-chat'));
        setIsOpen(false); // Close the notification tray
        return;
      }
      
      if (!notification.isRead) {
        await handleMarkAsRead(notification.id);
      }
      
      const route = getNotificationRoute(notification.type);
      if (route) {
        // If the route is the notifications page, add highlight parameter
        if (route === '/notifications') {
          navigate(`/notifications?highlight=${notification.id}`);
        } else {
          navigate(route);
        }
        setIsOpen(false); // Close the notification tray
      }
      
      onNotificationClick?.(notification);
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const handleSelectNotification = (notificationId: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <BellRing className="h-5 w-5 mr-2" />
                Notifications
                {unreadCount > 0 && (
                  <Badge className="ml-2">{unreadCount} unread</Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
              <Button
                size="sm"
                  variant="outline"
                  onClick={handleMarkAllAsRead}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark All Read
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    if (confirm('Are you sure you want to clear all notifications?')) {
                      try {
                        await clearAllNotifications();
                      } catch (error) {
                        console.error('Error clearing all notifications:', error);
                      }
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center space-x-2">
              <div className="flex-1">
              <Input
                placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            </div>

            {/* Bulk Actions */}
            {selectedNotifications.size > 0 && (
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">
                  {selectedNotifications.size} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('read')}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark Read
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
                <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
                <TabsTrigger value="CHAT_MESSAGE">Chat</TabsTrigger>
                <TabsTrigger value="RESTOCK_REQUEST">Restock</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="lowStock">Alerts</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="space-y-2">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No notifications found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50",
                          getNotificationColor(notification.isRead),
                          !notification.isRead && "border-l-4 border-l-blue-500"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <Checkbox
                          checked={selectedNotifications.has(notification.id)}
                          onCheckedChange={() => handleSelectNotification(notification.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              {getNotificationIcon(notification.type)}
                              <h4 className="text-sm font-medium">{notification.type}</h4>
                              {getStatusIcon(notification.isRead)}
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500">
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        </div>
                        
                        <div className="flex flex-col space-y-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
            </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedNotificationTray;