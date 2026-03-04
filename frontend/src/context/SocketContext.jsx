import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import {
  generateUserKeyPair,
  loadPrivateKey,
  loadPublicKeyJwk,
  encryptMessage,
} from "../utils/crypto";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

const API_BASE = "http://localhost:5000/api";

/**
 * Bootstraps E2EE keys for the user:
 * 1. If no private key exists in IndexedDB → generate a new RSA key pair
 * 2. Upload the public key to the server
 */
const bootstrapE2EEKeys = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    let publicKeyJwk = await loadPublicKeyJwk();

    if (!publicKeyJwk) {
      // First time — generate a fresh key pair
      const keyPair = await generateUserKeyPair();
      publicKeyJwk  = keyPair.publicKeyJwk;
      console.log("🔑 E2EE key pair generated");
    }

    // Upload / re-confirm public key with the server
    await fetch(`${API_BASE}/keys/upload`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ publicKey: publicKeyJwk }),
    });

    console.log("🔑 Public key synced with server");
  } catch (err) {
    console.warn("E2EE key bootstrap failed:", err.message);
  }
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket]           = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const newSocket = io("http://localhost:5000", {
        auth:                 { token },
        transports:           ["polling", "websocket"], // Try polling first, then websocket
        reconnection:         true,
        reconnectionDelay:    1000,
        reconnectionDelayMax: 3000,
        reconnectionAttempts: 5,
        timeout:              20000,
        forceNew:             false,
      });

      newSocket.on("connect", () => {
        setIsConnected(true);
        // Bootstrap E2EE keys every time we (re)connect
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

  /**
   * Helper: encrypt a message and emit it via the socket.
   * @param {object} opts
   * @param {string} opts.groupId
   * @param {string} opts.channelId
   * @param {CryptoKey} opts.groupAesKey  — the decrypted AES key for this group
   * @param {string} opts.text            — plaintext to encrypt & send
   * @returns {Promise<object>}           — server acknowledgement
   */
  const sendEncryptedMessage = async ({ groupId, channelId, groupAesKey, text }) => {
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
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, sendEncryptedMessage }}>
      {children}
    </SocketContext.Provider>
  );
};
