/**
 * Neutron E2EE Crypto Utility
 * All operations use the native Web Crypto API — zero external dependencies.
 *
 * Encrypted group messaging model:
 *   • Each user has an RSA-OAEP key pair (4096-bit)
 *   • Each group has a single AES-GCM-256 key
 *   • The AES key is stored encrypted with every member's RSA public key
 *   • Messages are encrypted with AES-GCM; only ciphertext + iv reach the server
 */

const DB_NAME = "neutron-e2ee";
const DB_VERSION = 1;
const STORE_NAME = "keys";
const PRIVATE_KEY_ID = "userPrivateKey";
const PUBLIC_KEY_ID = "userPublicKey";

// ─── IndexedDB helpers ─────────────────────────────────────────────────────

const openDB = () =>
    new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            e.target.result.createObjectStore(STORE_NAME);
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });

const idbSet = async (key, value) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e.target.error);
    });
};

const idbGet = async (key) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
};

// ─── Key generation ────────────────────────────────────────────────────────

/**
 * Generate a new RSA-OAEP key pair for key wrapping.
 * Returns { publicKeyJwk, privateKey }.
 * The private key CryptoKey object is stored in IndexedDB — it's never serialized.
 */
export const generateUserKeyPair = async () => {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true, // extractable (public key must be exportable to share)
        ["encrypt", "decrypt"]
    );

    const publicKeyJwk = JSON.stringify(
        await crypto.subtle.exportKey("jwk", keyPair.publicKey)
    );

    // Persist
    await idbSet(PRIVATE_KEY_ID, keyPair.privateKey);
    await idbSet(PUBLIC_KEY_ID, publicKeyJwk);

    return { publicKeyJwk, privateKey: keyPair.privateKey };
};

/**
 * Load the user's private key from IndexedDB.
 * Returns null if not yet generated.
 */
export const loadPrivateKey = async () => {
    return idbGet(PRIVATE_KEY_ID);
};

/**
 * Load the user's public key JWK string from IndexedDB.
 */
export const loadPublicKeyJwk = async () => {
    return idbGet(PUBLIC_KEY_ID);
};

/**
 * Generate a new AES-GCM-256 key for a group.
 */
export const generateGroupKey = async () => {
    return crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
};

// ─── Group key distribution ───────────────────────────────────────────────

/**
 * Import a raw RSA-OAEP public key from a JWK JSON string.
 */
const importPublicKey = (jwkString) =>
    crypto.subtle.importKey(
        "jwk",
        JSON.parse(jwkString),
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["encrypt"]
    );

/**
 * Encrypt an AES group key with a recipient's RSA public key.
 * Returns a base64 string suitable for storage.
 */
export const encryptGroupKey = async (groupAesKey, recipientPublicKeyJwk) => {
    const rawAes = await crypto.subtle.exportKey("raw", groupAesKey); // ArrayBuffer
    const pubKey = await importPublicKey(recipientPublicKeyJwk);
    const wrapped = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, pubKey, rawAes);
    return btoa(String.fromCharCode(...new Uint8Array(wrapped)));
};

/**
 * Decrypt an encrypted AES group key using the user's RSA private key.
 * Returns a usable AES-GCM CryptoKey.
 */
export const decryptGroupKey = async (encryptedGroupKeyB64, privateKey) => {
    const encrypted = Uint8Array.from(atob(encryptedGroupKeyB64), (c) => c.charCodeAt(0));
    const rawAes = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, encrypted);
    return crypto.subtle.importKey("raw", rawAes, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
};

// ─── Message encryption ───────────────────────────────────────────────────

/**
 * Encrypt a plaintext message with the group AES-GCM key.
 * Returns { ciphertext: string (base64), iv: string (base64) }.
 */
export const encryptMessage = async (plaintext, groupAesKey) => {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    const encoded = new TextEncoder().encode(plaintext);
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, groupAesKey, encoded);
    return {
        ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
        iv: btoa(String.fromCharCode(...iv)),
    };
};

/**
 * Decrypt a message previously encrypted with encryptMessage.
 * Returns the plaintext string, or "[Encrypted message]" on failure.
 */
export const decryptMessage = async (ciphertextB64, ivB64, groupAesKey) => {
    try {
        const cipherbuf = Uint8Array.from(atob(ciphertextB64), (c) => c.charCodeAt(0));
        const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
        const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, groupAesKey, cipherbuf);
        return new TextDecoder().decode(decrypted);
    } catch {
        return "[Encrypted message]";
    }
};

// ─── Session cache for group AES keys ────────────────────────────────────
// Avoids re-decrypting the same key on every message in a session.

const _groupKeyCache = new Map(); // groupId -> AES CryptoKey

export const cacheGroupKey = (groupId, aesKey) => {
    _groupKeyCache.set(groupId, aesKey);
};

export const getCachedGroupKey = (groupId) => {
    return _groupKeyCache.get(groupId) || null;
};

export const clearGroupKeyCache = () => {
    _groupKeyCache.clear();
};
