// firebase/admin.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

console.log("🔥 Module loaded: firebase/admin.ts");
console.log("🔍 DEBUG - FIREBASE_CONFIG exists?", process.env.FIREBASE_CONFIG ? "YES" : "NO");
console.log("🔍 DEBUG - FIREBASE_CONFIG length:", process.env.FIREBASE_CONFIG?.length || 0);

// Use global object to persist across module loads
const globalForFirebase = global as typeof global & {
  firebaseAdminApp?: any;
  firebaseAdminAuth?: any;
  firebaseAdminDb?: any;
};

function initFirebaseAdmin() {
  // Check if already initialized in global scope
  if (globalForFirebase.firebaseAdminApp) {
    console.log("⚠️ Using existing Firebase instance from global scope");
    return {
      auth: globalForFirebase.firebaseAdminAuth || getAuth(),
      db: globalForFirebase.firebaseAdminDb || getFirestore()
    };
  }

  console.log("🔥 [Firebase Admin] Initializing Firebase Admin SDK...");
  const apps = getApps();

  if (!apps.length) {
    console.log("🔥 [Firebase Admin] No Firebase app found, initializing new one...");

    // Try single config first (for Vercel)
    const firebaseConfig = process.env.FIREBASE_CONFIG;

    if (firebaseConfig) {
      console.log("✅ Found FIREBASE_CONFIG, using single config approach...");

      try {
        const serviceAccount = JSON.parse(firebaseConfig);

        if (serviceAccount.private_key) {
          console.log("🔧 Fixing private key newlines...");
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        initializeApp({
          credential: cert(serviceAccount),
        });
        console.log("✅ [Firebase Admin] Initialized with FIREBASE_CONFIG");
      } catch (error) {
        console.error("❌ Failed to parse FIREBASE_CONFIG:", error);
        throw error;
      }
    } else {
      // Fallback to individual env vars
      console.log("Using individual env vars approach...");
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error("Firebase Admin environment variables are not set");
      }

      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
    }
  }

  const auth = getAuth();
  const db = getFirestore();

  // Store in global scope
  globalForFirebase.firebaseAdminApp = getApps()[0];
  globalForFirebase.firebaseAdminAuth = auth;
  globalForFirebase.firebaseAdminDb = db;

  // Apply settings once
  db.settings({ ignoreUndefinedProperties: true });
  console.log("✅ [Firebase Admin] Firebase initialized and stored globally");

  return { auth, db };
}

export const { auth, db } = initFirebaseAdmin();
export function getDB() { return db; }