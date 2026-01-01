const admin = require("firebase-admin");
const path = require("path");

try {
  // Adjust path if serviceAccountKey is in the root server folder
  const serviceAccount = require(path.join(
    __dirname,
    "../serviceAccountKey.json"
  ));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("🔥 Firebase Admin Initialized");
} catch (err) {
  console.log("⚠️ Firebase Admin not configured, using OAuth2Client only");
}

module.exports = admin;
