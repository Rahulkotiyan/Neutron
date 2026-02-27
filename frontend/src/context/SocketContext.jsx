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
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 10,
          timeout: 20000,
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
          console.warn("Socket connection error:", err.message);
        });

        setSocket(newSocket);

        return () => {
          newSocket.close();
        };
      } catch (err) {
        console.warn("Socket.io initialization error:", err.message);
      }
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
