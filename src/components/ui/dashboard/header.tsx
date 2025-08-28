import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell,
  LogOut,
  Settings,
  User,
  X,
  Trash2,
  ExternalLink,
  AlertTriangle,
  Package,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFetchRolesAndPerms } from "@/lib/perms";
import Sidebar from "./sidebar";
import { useNotifications } from "@/contexts/NotificationsContext";
import { Tooltip } from "@mui/material";
import { usePermissions } from "@/contexts/PermissionsContext";
import Swal from "sweetalert2";

export function Header() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<string>("all");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const name = user?.name;
  const email = user?.email;
  const role = user?.role;
  const userData = useFetchRolesAndPerms();
  const { hasModuleAccess } = usePermissions();
  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    clearNotification,
    clearAllNotifications,
  } = useNotifications();
  console.log("User Data:", userData);

  // Filter notifications based on selected type
  const filteredNotifications = notifications.filter((notification) => {
    if (notificationFilter === "all") return true;
    if (notificationFilter === "unread") return !notification.isRead;
    return notification.type === notificationFilter;
  });

  // Get unique notification types for filter
  const notificationTypes = [...new Set(notifications.map((n) => n.type))];

  // Get notification route and check permissions
  const getNotificationRoute = (type?: string) => {
    switch (type) {
      case "LOW_STOCK_ALERT":
        return hasModuleAccess("inventory") ? "/inventory" : null;
      case "RESTOCK_REQUEST":
      case "RESTOCK_APPROVED":
      case "RESTOCK_REJECTED":
        return hasModuleAccess("restock") ? "/restock-management" : null;
      case "PRODUCT_CREATED":
      case "PRODUCT_UPDATED":
      case "FLAVOR_CREATED":
      case "CATEGORY_CREATED":
      case "CATEGORY_UPDATED":
      case "CATEGORY_DEACTIVATED":
        return hasModuleAccess("inventory") ? "/inventory" : null;
      case "LOGIN_SUCCESS":
      default:
        return null;
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "LOW_STOCK_ALERT":
        return "🔴";
      case "RESTOCK_REQUEST":
        return "📦";
      case "RESTOCK_APPROVED":
        return "✅";
      case "RESTOCK_REJECTED":
        return "❌";
      case "PRODUCT_CREATED":
      case "PRODUCT_UPDATED":
        return "🆕";
      case "FLAVOR_CREATED":
        return "🍦";
      case "CATEGORY_CREATED":
      case "CATEGORY_UPDATED":
      case "CATEGORY_DEACTIVATED":
        return "📂";
      default:
        return "🔔";
    }
  };

  // Get notification priority color
  const getNotificationPriorityColor = (type: string) => {
    switch (type) {
      case "LOW_STOCK_ALERT":
        return "#ef4444"; // red-500
      case "RESTOCK_REQUEST":
        return "#f59e0b"; // amber-500
      case "RESTOCK_REJECTED":
        return "#dc2626"; // red-600
      case "RESTOCK_APPROVED":
        return "#10b981"; // emerald-500
      default:
        return "#6b7280"; // gray-500
    }
  };

  // Format notification message for display
  const formatNotificationMessage = (message: string, type: string) => {
    // Extract key information from message for brief display
    if (type === "LOW_STOCK_ALERT") {
      const match = message.match(
        /Low stock alert: (.+?) in (.+?) has only (\d+) units remaining/
      );
      if (match) {
        return `${match[1]} - ${match[2]} (${match[3]} units)`;
      }
    }

    if (type === "RESTOCK_REQUEST") {
      const match = message.match(
        /Restock request: (\d+) units of (.+?) requested for (.+?)/
      );
      if (match) {
        return `${match[2]} - ${match[3]} (${match[1]} units)`;
      }
    }

    // Fallback to truncated message
    return message.length > 60 ? message.substring(0, 60) + "..." : message;
  };
  // Handle notification click - navigate to notifications page
  const handleNotificationClick = async (notification: any) => {
    try {
      // Mark as read first
      await markRead(notification.id);
      
      // Navigate to notifications page with the specific notification ID
      setIsNotificationsOpen(false);
      navigate(`/notifications?highlight=${notification.id}`);
    } catch (error) {
      console.error("Error handling notification:", error);
    }
  };

  const handleClearNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await clearNotification(id);
    } catch {}
  };

  // Play notification sound (optional)
  const playNotificationSound = () => {
    try {
      // Create a simple notification sound
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.2
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      // Fallback: silent failure if audio is not supported
      console.log("Audio not supported");
    }
  };

  // Enhanced clear all notifications with confirmation
  const handleClearAllNotifications = async () => {
    try {
      const result = await Swal.fire({
        title: "Clear All Notifications?",
        text: "This will remove all notifications from your list. This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, clear all",
        cancelButtonText: "Cancel",
        allowOutsideClick: true,
        allowEscapeKey: true,
        backdrop: true,
        customClass: {
          popup: "rounded-xl shadow-xl z-[99999]",
          confirmButton: "rounded-lg px-6 py-2 font-medium",
          cancelButton: "rounded-lg px-6 py-2 font-medium",
          container: "z-[99999]",
        },
      });

      if (result.isConfirmed) {
        await clearAllNotifications();

        // Show success feedback
        Swal.fire({
          icon: "success",
          title: "All Notifications Cleared",
          text: "All notifications have been removed from your list.",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
          allowOutsideClick: true,
          allowEscapeKey: true,
          customClass: {
            popup: "z-[99999]",
            container: "z-[99999]",
          },
        });
      }
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to clear notifications. Please try again.",
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
        allowOutsideClick: true,
        allowEscapeKey: true,
        customClass: {
          popup: "z-[99999]",
          container: "z-[99999]",
        },
      });
    }
  };

  return (
    <header className="flex h-16 items-center border-b bg-background px-4 md:px-6">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2 md:hidden">
          <Sidebar />
        </div>
        <div className="flex items-center md:ml-auto">
          <Sheet
            open={isNotificationsOpen}
            onOpenChange={setIsNotificationsOpen}
          >
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative group">
                <Bell className="h-5 w-5 transition-transform group-hover:scale-110" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full bg-orange-400 text-[10px] text-white flex items-center justify-center font-bold animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[800px] sm:w-[800px]">
              <div className="flex flex-col h-full">
                <div className="mb-4 pb-3 border-b w-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Notifications
                      </h3>
                      {notifications.length > 0 && (
                        <div className="flex items-center justify-between gap-3 mt-1 w-full ">
                          <p className="text-sm text-gray-500">
                            {filteredNotifications.length} of{" "}
                            {notifications.length} notification
                            {notifications.length !== 1 ? "s" : ""}
                            {notificationFilter !== "all" &&
                              ` (${notificationFilter})`}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* View All Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        // If there's a selected notification, highlight it
                        const selectedNotification = filteredNotifications.find(
                          (n) => !n.isRead
                        );
                        if (selectedNotification) {
                          navigate(
                            `/notifications?highlight=${selectedNotification.id}`
                          );
                        } else {
                          navigate("/notifications");
                        }
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      View All
                    </Button>
                  </div>
                  {notifications.length > 0 && (
                    <div className="flex items-center gap-2">
                      <select
                        value={notificationFilter}
                        onChange={(e) => setNotificationFilter(e.target.value)}
                        className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All</option>
                        <option value="unread">Unread</option>
                        {notificationTypes.map((type) => (
                          <option key={type} value={type}>
                            {type.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-auto">
                  {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Bell className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        {notifications.length === 0
                          ? "No notifications"
                          : "No matching notifications"}
                      </p>
                      <p className="text-sm text-gray-500 max-w-xs">
                        {notifications.length === 0
                          ? "You're all caught up! New notifications will appear here when they arrive."
                          : `Try changing the filter or check back later.`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredNotifications.map((n) => (
                        <li key={n.id} className="list-none">
                          <div className="relative group">
                            <div
                              className={`flex items-center gap-3 px-3 py-3 hover:bg-accent/40 transition-all duration-200 rounded-lg border border-transparent hover:border-gray-200 ${
                                n.isRead ? "bg-gray-100" : "bg-white shadow-sm"
                              } ${
                                n.type === "LOW_STOCK_ALERT"
                                  ? "border-l-4 border-l-red-500"
                                  : ""
                              }`}
                            >
                              {/* Notification Icon */}
                              <div className="flex-shrink-0">
                                <span className="text-lg">
                                  {getNotificationIcon(n.type)}
                                </span>
                              </div>

                              {/* Notification Content */}
                              <button
                                className={`flex-1 text-left ${
                                  n.isRead ? "opacity-40" : ""
                                }`}
                                onClick={() => handleNotificationClick(n)}
                              >
                                <div className="space-y-1">
                                  {/* Priority indicator and unread status */}
                                  <div className="flex items-center gap-2">
                                    {/* { (
                                      <span className="inline-block h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                                    )} */}
                                    {!n.isRead && (
                                      <span
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                          backgroundColor:
                                            getNotificationPriorityColor(
                                              n.type
                                            ),
                                        }}
                                      ></span>
                                    )}
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                      {n.type.replace(/_/g, " ")}
                                    </span>
                                    {n.type === "LOW_STOCK_ALERT" && (
                                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                        High Priority
                                      </span>
                                    )}
                                  </div>

                                  {/* Message */}
                                  <p className="text-sm font-medium text-gray-800 leading-tight max-w-[280px]">
                                    {formatNotificationMessage(
                                      n.message,
                                      n.type
                                    )}
                                  </p>

                                  {/* Timestamp */}
                                  <p className="text-xs text-gray-500">
                                    {new Date(n.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </button>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                {/* Route indicator if available */}
                                {getNotificationRoute(n.type) && (
                                  <Tooltip title="Click to view details and navigate to module">
                                    <ExternalLink className="h-4 w-4 text-blue-500 hover:text-blue-600 transition-colors" />
                                  </Tooltip>
                                )}

                                {/* Clear button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-200 rounded-full"
                                  onClick={(e) =>
                                    handleClearNotification(e, n.id)
                                  }
                                  title="Clear notification"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                {notifications.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {unreadCount > 0 && (
                          <span className="inline-flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                            {unreadCount} unread notification
                            {unreadCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={markAllRead}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm px-3 py-2"
                          disabled={unreadCount === 0}
                        >
                          Mark all read
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearAllNotifications}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm px-3 py-2"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear all
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <div className="text-sm">{name || "User"}</div>
                  <p className="text-xs text-primary/80">{role}</p>
                </div>
                <div className="text-muted-foreground text-xs">
                  <Tooltip title={email || "jhondoe@gmail.com"}>
                    <div className="text-gray-600 text-sm truncate text-ellipsis overflow-hidden max-w-[110px] cursor-default">
                      {email || "jhondoe@gmail.com"}
                    </div>
                  </Tooltip>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* View Notifications Button */}
              <DropdownMenuItem
                asChild
                className="cursor-pointer"
                onClick={() => navigate("/notifications")}
              >
                <div className="flex items-center gap-2 relative">
                  <div className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 h-3 w-3 p-1 rounded-full bg-orange-400 text-[10px] text-white flex items-center justify-center font-bold">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span>View Notifications</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* <DropdownMenuItem asChild>
                <Link to="/" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem> */}
              <DropdownMenuItem onClick={logout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
