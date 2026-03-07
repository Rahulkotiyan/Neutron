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
} catch (err) {
  console.log("Firebase initialization failed:",err);
  process.exit(1);
}

module.exports = admin;
