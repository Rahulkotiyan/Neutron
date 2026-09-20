import React, { createContext, useContext, useEffect, useState } from "react";
import { SOCKET_URL } from "../utils/api";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [authVersion, setAuthVersion] = useState(0);

  // Re-run the socket lifecycle whenever auth state changes
  // (login / logout / token expiry / cross-tab localStorage changes).
  useEffect(() => {
    const onAuthChanged = () => setAuthVersion((v) => v + 1);
    const onStorage = (e) => {
      if (e.key === "token" || e.key === "user") setAuthVersion((v) => v + 1);
    };
    window.addEventListener("auth_changed", onAuthChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("auth_changed", onAuthChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    let cancelled = false;
    let newSocket;

    const initSocket = async () => {
      try {
        const { default: io } = await import("socket.io-client");
        if (cancelled) return;

        newSocket = io(SOCKET_URL, {
          auth:                 { token },
          transports:           ["websocket"],
          reconnection:         true,
          reconnectionDelay:    500,
          reconnectionDelayMax: 2000,
          reconnectionAttempts: 10,
          timeout:              3000,
          forceNew:             true,
        });

        newSocket.on("connect", () => setIsConnected(true));
        newSocket.on("disconnect", () => setIsConnected(false));
        newSocket.on("connect_error", (err) => {
          if (import.meta.env?.DEV) console.warn("Socket error:", err.message);
          setIsConnected(false);
        });

        setSocket(newSocket);
      } catch (err) {
        console.warn("Socket.io init error:", err.message);
      }
    };

    initSocket();

    return () => {
      cancelled = true;
      if (newSocket) newSocket.disconnect();
    };
  }, [authVersion]);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
    }}>
      {children}
    </SocketContext.Provider>
  );
};