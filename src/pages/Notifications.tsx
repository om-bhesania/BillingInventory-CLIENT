import React, { useState, useEffect, useRef } from "react";
import { useNotifications } from "@/contexts/NotificationsContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bell, 
  Search, 
  Filter, 
  ExternalLink, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  Package,
  ShoppingCart,
  FileText,
  Settings,
  Home,
  X
} from "lucide-react";
import { Tooltip } from "@mui/material";
import { useToast } from "@/hooks/use-toast";

export default function Notifications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [highlightedNotificationId, setHighlightedNotificationId] = useState<string | null>(null);
  const [newNotifications, setNewNotifications] = useState<Set<string>>(new Set());
  
  const { notifications, unreadCount, markRead, markAllRead, clearNotification, clearAllNotifications } = useNotifications();
  const { hasModuleAccess } = usePermissions();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const notificationRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { toast } = useToast();

  // Handle URL parameters for highlighting
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlightId = params.get('highlight');
    
    if (highlightId) {
      setHighlightedNotificationId(highlightId);
      
      // Find the notification to show in toast
      const notification = notifications.find(n => n.id === highlightId);
      if (notification) {
        // Show toast notification
        toast({
          title: "Notification Found",
          description: `Scrolling to: ${notification.type.replace(/_/g, " ")}`,
        });
      }
      
      // Scroll to the highlighted notification after a short delay to ensure rendering
      setTimeout(() => {
        const element = notificationRefs.current[highlightId];
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          // Remove the highlight parameter from URL after scrolling
          navigate('/notifications', { replace: true });
        }
      }, 500);
    }
  }, [location.search, navigate, notifications]);

  // Track new notifications for highlighting
  useEffect(() => {
    const newUnreadNotifications = notifications
      .filter(n => !n.isRead)
      .map(n => n.id);
    
    setNewNotifications(prev => {
      const newSet = new Set(prev);
      newUnreadNotifications.forEach(id => newSet.add(id));
      return newSet;
    });
  }, [notifications]);

  // Clear highlight after a delay
  useEffect(() => {
    if (highlightedNotificationId) {
      const timer = setTimeout(() => {
        setHighlightedNotificationId(null);
      }, 2000); // Keep highlight for 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [highlightedNotificationId]);

  // Filter and sort notifications
  const filteredNotifications = notifications
    .filter((notification) => {
      const matchesSearch = notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           notification.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (notification.category || "SYSTEM").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
                           (statusFilter === "unread" && !notification.isRead) ||
                           (statusFilter === "read" && notification.isRead);
      
      // Fix category filtering - check both category and type
      const notificationCategory = notification.category || "SYSTEM";
      const matchesCategory = typeFilter === "all" || 
                             notificationCategory === typeFilter ||
                             (typeFilter === "CHAT" && (notificationCategory === "CHAT" || notification.type.includes("CHAT"))) ||
                             (typeFilter === "RESTOCK" && (notificationCategory === "RESTOCK" || notification.type.includes("RESTOCK"))) ||
                             (typeFilter === "INVENTORY" && (notificationCategory === "INVENTORY" || notification.type.includes("LOW_STOCK") || notification.type.includes("PRODUCT"))) ||
                             (typeFilter === "BILLING" && (notificationCategory === "BILLING" || notification.type.includes("INVOICE"))) ||
                             (typeFilter === "FACTORY" && (notificationCategory === "FACTORY" || notification.type.includes("FACTORY"))) ||
                             (typeFilter === "SYSTEM" && notificationCategory === "SYSTEM");
      
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "priority":
          const priorityOrder = { "LOW_STOCK_ALERT": 1, "RESTOCK_REQUEST": 2, "RESTOCK_REJECTED": 3, "RESTOCK_APPROVED": 4 };
          return (priorityOrder[a.type as keyof typeof priorityOrder] || 5) - (priorityOrder[b.type as keyof typeof priorityOrder] || 5);
        default:
          return 0;
      }
    });

  // Get notification icon based on type and category
  const getNotificationIcon = (type: string, category: string) => {
    // First check by category for better organization
    switch (category) {
      case "INVENTORY":
        return <Package className="h-5 w-5 text-blue-500" />;
      case "BILLING":
        return <FileText className="h-5 w-5 text-green-500" />;
      case "RESTOCK":
        return <Package className="h-5 w-5 text-amber-500" />;
      case "SYSTEM":
        return <Settings className="h-5 w-5 text-gray-500" />;
      case "CHAT":
        return <Bell className="h-5 w-5 text-purple-500" />;
      case "FACTORY":
        return <Home className="h-5 w-5 text-indigo-500" />;
      default:
        // Fallback to type-based icons
        switch (type) {
          case "LOW_STOCK_ALERT":
            return <AlertTriangle className="h-5 w-5 text-red-500" />;
          case "RESTOCK_REQUEST":
            return <Package className="h-5 w-5 text-amber-500" />;
          case "RESTOCK_APPROVED":
            return <CheckCircle className="h-5 w-5 text-green-500" />;
          case "RESTOCK_REJECTED":
            return <X className="h-5 w-5 text-red-600" />;
          case "SHOP_INVOICE_CREATED":
          case "FACTORY_INVOICE_CREATED":
            return <FileText className="h-5 w-5 text-green-500" />;
          case "PRODUCT_CREATED":
          case "PRODUCT_UPDATED":
            return <FileText className="h-5 w-5 text-blue-500" />;
          case "FLAVOR_CREATED":
            return <Package className="h-5 w-5 text-purple-500" />;
          case "CATEGORY_CREATED":
          case "CATEGORY_UPDATED":
          case "CATEGORY_DEACTIVATED":
            return <Settings className="h-5 w-5 text-gray-500" />;
          case "LOGIN_SUCCESS":
            return <Home className="h-5 w-5 text-green-600" />;
          default:
            return <Bell className="h-5 w-5 text-gray-500" />;
        }
    }
  };

  // Get notification priority color based on priority field
  const getNotificationPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "destructive";
      case "HIGH":
        return "destructive";
      case "MEDIUM":
        return "secondary";
      case "LOW":
        return "outline";
      default:
        return "outline";
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "INVENTORY":
        return "bg-blue-100 text-blue-800";
      case "BILLING":
        return "bg-green-100 text-green-800";
      case "RESTOCK":
        return "bg-amber-100 text-amber-800";
      case "SYSTEM":
        return "bg-gray-100 text-gray-800";
      case "CHAT":
        return "bg-purple-100 text-purple-800";
      case "FACTORY":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get notification route and check permissions
  const getNotificationRoute = (type?: string) => {
    switch (type) {
      case "LOW_STOCK_ALERT":
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
        return hasModuleAccess("Restock Management") ? "/restock-management" : null;
      case "PRODUCT_CREATED":
      case "PRODUCT_UPDATED":
      case "FLAVOR_CREATED":
      case "CATEGORY_CREATED":
      case "CATEGORY_UPDATED":
      case "CATEGORY_DEACTIVATED":
        return hasModuleAccess("Inventory") ? "/inventory" : null;
      case "CHAT_MESSAGE":
      case "CHAT_REQUEST":
        return null; // Handle chat notifications specially - don't navigate
      case "LOGIN_SUCCESS":
      default:
        return null;
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: any) => {
    try {
      // Handle chat notifications specially
      if (notification.type === 'CHAT_MESSAGE' || notification.type === 'CHAT_REQUEST') {
        // Don't mark as read automatically - let user decide
        // Trigger floating chat window
        window.dispatchEvent(new CustomEvent('open-floating-chat'));
        return;
      }
      
      if (!notification.isRead) {
        await markRead(notification.id);
      }
      const route = getNotificationRoute(notification.type);
      if (route) {
        // If the route is the notifications page, add highlight parameter
        if (route === '/notifications') {
          navigate(`/notifications?highlight=${notification.id}`);
        } else {
          navigate(route);
        }
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Handle go to module
  const handleGoToModule = (notification: any) => {
    const route = getNotificationRoute(notification.type);
    if (route) {
      // If the route is the notifications page, add highlight parameter
      if (route === '/notifications') {
        navigate(`/notifications?highlight=${notification.id}`);
      } else {
        navigate(route);
      }
    }
  };

  // Handle clear notification
  const handleClearNotification = async (notification: any) => {
    try {
      await clearNotification(notification.id);
      toast({
        title: "Notification Cleared",
        description: "The notification has been removed from your list.",
      });
    } catch (error) {
      console.error("Error clearing notification:", error);
      toast({
        title: "Error",
        description: "Failed to clear notification. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle clear all notifications
  const handleClearAllNotifications = async () => {
    try {
      if (window.confirm("Clear All Notifications?\n\nThis will remove all notifications from your list. This action cannot be undone.")) {
        await clearAllNotifications();
        toast({
          title: "All Notifications Cleared",
          description: "All notifications have been removed from your list.",
        });
      }
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      toast({
        title: "Error",
        description: "Failed to clear notifications. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get unique notification types and categories for filter
  const notificationTypes = [...new Set(notifications.map((n) => n.type))];
  const notificationCategories = [...new Set(notifications.map((n) => n.category || "SYSTEM"))];
  
  // Get counts for each category
  const getCategoryCount = (category: string) => {
    return notifications.filter(n => {
      const notificationCategory = n.category || "SYSTEM";
      return category === "all" ? true :
             notificationCategory === category ||
             (category === "CHAT" && (notificationCategory === "CHAT" || n.type.includes("CHAT"))) ||
             (category === "RESTOCK" && (notificationCategory === "RESTOCK" || n.type.includes("RESTOCK"))) ||
             (category === "INVENTORY" && (notificationCategory === "INVENTORY" || n.type.includes("LOW_STOCK") || n.type.includes("PRODUCT"))) ||
             (category === "BILLING" && (notificationCategory === "BILLING" || n.type.includes("INVOICE"))) ||
             (category === "FACTORY" && (notificationCategory === "FACTORY" || n.type.includes("FACTORY"))) ||
             (category === "SYSTEM" && notificationCategory === "SYSTEM");
    }).length;
  };
  
  const getUnreadCategoryCount = (category: string) => {
    return notifications.filter(n => {
      const notificationCategory = n.category || "SYSTEM";
      const matchesCategory = category === "all" ? true :
             notificationCategory === category ||
             (category === "CHAT" && (notificationCategory === "CHAT" || n.type.includes("CHAT"))) ||
             (category === "RESTOCK" && (notificationCategory === "RESTOCK" || n.type.includes("RESTOCK"))) ||
             (category === "INVENTORY" && (notificationCategory === "INVENTORY" || n.type.includes("LOW_STOCK") || n.type.includes("PRODUCT"))) ||
             (category === "BILLING" && (notificationCategory === "BILLING" || n.type.includes("INVOICE"))) ||
             (category === "FACTORY" && (notificationCategory === "FACTORY" || n.type.includes("FACTORY"))) ||
             (category === "SYSTEM" && notificationCategory === "SYSTEM");
      return matchesCategory && !n.isRead;
    }).length;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="text-blue-600 hover:text-blue-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
          <Button
            variant="outline"
            onClick={handleClearAllNotifications}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear all
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories ({getCategoryCount("all")})</SelectItem>
                <SelectItem value="CHAT">Chat ({getCategoryCount("CHAT")})</SelectItem>
                <SelectItem value="RESTOCK">Restock ({getCategoryCount("RESTOCK")})</SelectItem>
                <SelectItem value="INVENTORY">Inventory ({getCategoryCount("INVENTORY")})</SelectItem>
                <SelectItem value="BILLING">Billing ({getCategoryCount("BILLING")})</SelectItem>
                <SelectItem value="FACTORY">Factory ({getCategoryCount("FACTORY")})</SelectItem>
                <SelectItem value="SYSTEM">System ({getCategoryCount("SYSTEM")})</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {notifications.length === 0 ? "No notifications" : "No matching notifications"}
              </h3>
              <p className="text-gray-500 max-w-md">
                {notifications.length === 0
                  ? "You're all caught up! New notifications will appear here when they arrive."
                  : "Try adjusting your filters or search terms."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              ref={(el) => notificationRefs.current[notification.id] = el}
              className={`transition-all duration-200 hover:shadow-md ${
                notification.isRead ? "bg-gray-50" : "bg-white border-l-4 border-l-blue-500"
              } ${
                highlightedNotificationId === notification.id 
                  ? "ring-4 ring-blue-500 ring-opacity-50 bg-blue-50 border-blue-300 animate-pulse" 
                  : ""
              } ${
                newNotifications.has(notification.id) && !notification.isRead
                  ? "bg-green-50 border-l-green-500 shadow-lg" 
                  : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon and Status */}
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type, notification.category || "SYSTEM")}
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mt-2 animate-pulse" />
                    )}
                    {/* Highlight indicator */}
                    {highlightedNotificationId === notification.id && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mt-2 animate-bounce" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className={getCategoryColor(notification.category || "SYSTEM")}>
                          {notification.category || "SYSTEM"}
                        </Badge>
                        <Badge variant={getNotificationPriorityColor(notification.priority || "MEDIUM")}>
                          {notification.priority || "MEDIUM"}
                        </Badge>
                        {!notification.isRead && (
                          <Badge variant="secondary" className="animate-pulse">
                            Unread
                          </Badge>
                        )}
                        {highlightedNotificationId === notification.id && (
                          <Badge variant="default" className="bg-blue-500 text-white animate-pulse">
                            You're here!
                          </Badge>
                        )}
                        {newNotifications.has(notification.id) && !notification.isRead && (
                          <Badge variant="default" className="bg-green-500 text-white animate-pulse">
                            New
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {notification.type.replace(/_/g, " ")}
                      </h3>
                      <p className="text-gray-800 text-base leading-relaxed">
                        {notification.message}
                      </p>
                    </div>

                    {/* Detailed Information */}
                    {notification.metadata && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Details:</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          {Object.entries(JSON.parse(notification.metadata)).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                              <span>{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNotificationClick(notification)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Read
                        </Button>
                      )}
                      
                      {getNotificationRoute(notification.type) && (
                        <Tooltip title="Go to related module">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGoToModule(notification)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Go to Module
                          </Button>
                        </Tooltip>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClearNotification(notification)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      {notifications.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing {filteredNotifications.length} of {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
              <span>
                {unreadCount} unread
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
