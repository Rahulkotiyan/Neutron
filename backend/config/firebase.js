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
    projectId: "neutron-55894", // Explicitly set project ID
  });
  console.log("🔥 Firebase Admin Initialized with project:", serviceAccount.project_id);
} catch (err) {
  console.log("⚠️ Firebase Admin not configured, using OAuth2Client only", err.message);
}

module.exports = admin;
