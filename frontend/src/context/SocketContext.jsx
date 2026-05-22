import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import io from "socket.io-client";
import {
  generateUserKeyPair,
  loadPrivateKey,
  loadPublicKeyJwk,
  encryptMessage,
} from "../utils/crypto";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

const SERVER_URL = "http://localhost:5000";
const API_BASE = "http://localhost:5000/api";

const bootstrapE2EEKeys = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    let publicKeyJwk = await loadPublicKeyJwk();

    if (!publicKeyJwk) {
      const keyPair = await generateUserKeyPair();
      publicKeyJwk  = keyPair.publicKeyJwk;
    }

    await fetch(`${API_BASE}/keys/upload`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ publicKey: publicKeyJwk }),
    });
  } catch (err) {
  }
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket]           = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const typingTimeouts = useRef({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const newSocket = io(SERVER_URL, {
        auth:                 { token },
        transports:           ["websocket", "polling"],
        reconnection:         true,
        reconnectionDelay:    500,
        reconnectionDelayMax: 2000,
        reconnectionAttempts: 10,
        timeout:              10000,
        forceNew:             false,
      });

      newSocket.on("connect", () => {
        setIsConnected(true);
        bootstrapE2EEKeys();
      });

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

  const sendMessage = useCallback(({ groupId, channelId, content, type = "DEFAULT" }) => {
    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        reject(new Error("Socket not connected"));
        return;
      }
      socket.emit(
        "send_message",
        { groupId, channelId, content, type },
        (ack) => {
          if (ack?.error) reject(new Error(ack.error));
          else resolve(ack);
        }
      );
    });
  }, [socket, isConnected]);

  const sendEncryptedMessage = useCallback(async ({ groupId, channelId, groupAesKey, text }) => {
    if (!socket || !isConnected) throw new Error("Socket not connected");
    const { ciphertext, iv } = await encryptMessage(text, groupAesKey);
    return new Promise((resolve, reject) => {
      socket.emit(
        "send_message",
        { groupId, channelId, ciphertext, iv, type: "ENCRYPTED" },
        (ack) => {
          if (ack?.error) reject(new Error(ack.error));
          else resolve(ack);
        }
      );
    });
  }, [socket, isConnected]);

  const emitTyping = useCallback((channelId) => {
    if (!socket || !isConnected) return;
    socket.emit("typing", { channelId });

    if (typingTimeouts.current[channelId]) {
      clearTimeout(typingTimeouts.current[channelId]);
    }
    typingTimeouts.current[channelId] = setTimeout(() => {
      socket.emit("stop_typing", { channelId });
    }, 2000);
  }, [socket, isConnected]);

  const emitStopTyping = useCallback((channelId) => {
    if (!socket || !isConnected) return;
    socket.emit("stop_typing", { channelId });
    if (typingTimeouts.current[channelId]) {
      clearTimeout(typingTimeouts.current[channelId]);
    }
  }, [socket, isConnected]);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      sendMessage,
      sendEncryptedMessage,
      emitTyping,
      emitStopTyping,
    }}>
      {children}
    </SocketContext.Provider>
  );
};
