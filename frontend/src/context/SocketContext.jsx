import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const newSocket = io("http://localhost:5000", {
          auth: { token },
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionDelay: 2000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 3,
          timeout: 10000,
          forceNew: true,
        });

        newSocket.on("connect", () => {
          console.log("Socket connected");
          setIsConnected(true);
        });

        newSocket.on("disconnect", () => {
          console.log("Socket disconnected");
          setIsConnected(false);
        });

        newSocket.on("connect_error", (err) => {
          // Only log connection errors in development
          if (process.env.NODE_ENV === 'development') {
            console.warn("Socket connection error:", err.message);
          }
          setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
          if (newSocket) {
            newSocket.disconnect();
          }
        };
      } catch (err) {
        console.warn("Socket.io initialization error:", err.message);
        setIsConnected(false);
      }
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
