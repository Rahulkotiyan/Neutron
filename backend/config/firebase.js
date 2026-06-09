const admin = require("firebase-admin");
const path = require("path");

try {
  let serviceAccount;

  // Render: read from env var as JSON string
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Local dev: read from file (gitignored)
    serviceAccount = require(path.join(__dirname, "../serviceAccountKey.json"));
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "neutron-55894",
  });
} catch (err) {
  console.warn("Firebase initialization failed (auth will be limited):", err.message);
  // Don't crash — some features work without Firebase
}

module.exports = admin;
