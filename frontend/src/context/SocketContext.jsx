import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { SOCKET_URL } from "../utils/api";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket]           = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const newSocket = io(SOCKET_URL, {
        auth:                 { token },
        transports:           ["websocket", "polling"],
        reconnection:         true,
        reconnectionDelay:    500,
        reconnectionDelayMax: 2000,
        reconnectionAttempts: 10,
        timeout:              10000,
        forceNew:             false,
      });

      newSocket.on("connect", () => setIsConnected(true));
      newSocket.on("disconnect", () => setIsConnected(false));
      newSocket.on("connect_error", (err) => {
        if (import.meta.env?.DEV) console.warn("Socket error:", err.message);
        setIsConnected(false);
      });

      setSocket(newSocket);
      return () => newSocket.disconnect();
    } catch (err) {
      console.warn("Socket.io init error:", err.message);
    }
  }, []);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
    }}>
      {children}
    </SocketContext.Provider>
  );
};
