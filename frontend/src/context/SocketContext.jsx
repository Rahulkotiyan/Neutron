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
      const newSocket = io("http://localhost:5000", {
        auth: { token },
        transports: ["websocket"],
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
        console.error("Socket connection error:", err);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
