var admin = require("firebase-admin");

var serviceAccount = require("../firebase_key.json");

const fb = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = fb