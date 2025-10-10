import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import useSessionStorage from "./use-sessionStorage";

interface WebSocketConfig {
  url?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

interface WebSocketEventHandlers {
  [event: string]: (data: any) => void;
}

export const useWebSocket = (config: WebSocketConfig = {}) => {
  const {
    url = import.meta.env.VITE_API_URL || "http://localhost:5000",
    autoConnect = true,

    reconnectDelay = 1000,
  } = config;

  const { user } = useAuth();
  const { toast } = useToast();
  const token = useSessionStorage("auth_token");
  console.log("token", token);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const eventHandlers = useRef<WebSocketEventHandlers>({});
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  const connect = useCallback(() => {
    if (!user || !token) {
      console.warn("WebSocket: No user or token available");
      return;
    }

    if (socket?.connected) {
      console.log("WebSocket: Already connected");
      return;
    }

    setConnectionStatus("connecting");

    const newSocket = io(url, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
    });

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("WebSocket: Connected successfully");
      setIsConnected(true);
      setConnectionStatus("connected");
      setReconnectAttempts(0);

      toast({
        type: "success",
        title: "Connected",
        text: "Real-time updates are now active",
        duration: 2000,
      });
    });

    newSocket.on("disconnect", (reason) => {
      console.log("WebSocket: Disconnected", reason);
      setIsConnected(false);
      setConnectionStatus("disconnected");

      if (reason === "io server disconnect") {
        // Server initiated disconnect, don't reconnect
        toast({
          type: "warning",
          title: "Disconnected",
          text: "Connection lost. Please refresh the page.",
          duration: 5000,
        });
      } else {
        // Client initiated disconnect or network issue
        handleReconnect();
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("WebSocket: Connection error", error);
      setConnectionStatus("error");
      handleReconnect();
    });

    // Register all event handlers
    Object.entries(eventHandlers.current).forEach(([event, handler]) => {
      newSocket.on(event, handler);
    });

    setSocket(newSocket);
  }, [user, token, url, toast]);

  // Handle reconnection logic
  const handleReconnect = useCallback(() => {
    if (reconnectAttempts >= reconnectAttempts) {
      console.error("WebSocket: Max reconnection attempts reached");
      setConnectionStatus("error");
      toast({
        type: "error",
        title: "Connection Failed",
        text: "Unable to establish real-time connection. Some features may be limited.",
        duration: 8000,
      });
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = reconnectDelay * Math.pow(2, reconnectAttempts); // Exponential backoff
    console.log(
      `WebSocket: Reconnecting in ${delay}ms (attempt ${
        reconnectAttempts + 1
      }/${reconnectAttempts})`
    );

    setReconnectAttempts((prev) => prev + 1);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [reconnectAttempts, reconnectDelay, connect, toast]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socket) {
      socket.disconnect();
      setSocket(null);
    }

    setIsConnected(false);
    setConnectionStatus("disconnected");
    setReconnectAttempts(0);
  }, [socket]);

  // Emit event
  const emit = useCallback(
    (event: string, data: any) => {
      if (socket?.connected) {
        socket.emit(event, data);
      } else {
        console.warn("WebSocket: Cannot emit event, not connected");
        toast({
          type: "warning",
          title: "Offline",
          text: "Cannot send data. Please check your connection.",
          duration: 3000,
        });
      }
    },
    [socket, toast]
  );

  // Register event handler
  const on = useCallback(
    (event: string, handler: (data: any) => void) => {
      eventHandlers.current[event] = handler;

      if (socket) {
        socket.on(event, handler);
      }
    },
    [socket]
  );

  // Unregister event handler
  const off = useCallback(
    (event: string) => {
      delete eventHandlers.current[event];

      if (socket) {
        socket.off(event);
      }
    },
    [socket]
  );

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && user && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, user, token, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    socket,
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    emit,
    on,
    off,
    reconnectAttempts,
  };
};
