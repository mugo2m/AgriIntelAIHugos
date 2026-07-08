"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

// Check if Firebase Admin is available
function isFirebaseAvailable() {
  return !!(auth && db);
}

// Set session cookie
export async function setSessionCookie(idToken: string) {
  try {
    if (!isFirebaseAvailable()) return;

    const cookieStore = await cookies();
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION * 1000,
    });

    cookieStore.set("session", sessionCookie, {
      maxAge: SESSION_DURATION,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });
  } catch {
    // Ignore errors
  }
}

// Type definitions
interface SignUpParams {
  uid: string;
  name: string;
  email: string;
  password: string;
  phone?: string | null;
}

interface SignInParams {
  email: string;
  idToken: string;
}

// New types for phone PIN authentication
interface CreatePhoneAccountParams {
  name: string;
  phone: string;
  pin: string;
}

interface SignInWithPhoneParams {
  phone: string;
  pin: string;
}

// ============================================
// EXISTING EMAIL AUTHENTICATION (UNCHANGED)
// ============================================

export async function signUp(params: SignUpParams) {
  try {
    if (!isFirebaseAvailable()) {
      return { success: false, message: "System error" };
    }

    const { uid, name, email, phone } = params;
    const userRecord = await db.collection("users").doc(uid).get();

    if (userRecord.exists) {
      return { success: false, message: "User already exists" };
    }

    // Save user with phone number
    await db.collection("users").doc(uid).set({
      name,
      email,
      phone: phone || null,
      authMethod: "email",
      createdAt: new Date().toISOString(),
    });

    return { success: true, message: "Account created" };
  } catch {
    return { success: false, message: "Failed to create account" };
  }
}

export async function signIn(params: SignInParams) {
  try {
    if (!isFirebaseAvailable()) {
      return { success: false, message: "System error" };
    }

    const { email, idToken } = params;
    const userRecord = await auth.getUserByEmail(email);

    if (!userRecord) {
      return { success: false, message: "User does not exist" };
    }

    await setSessionCookie(idToken);
    return { success: true, message: "Signed in", userId: userRecord.uid };
  } catch {
    return { success: false, message: "Failed to sign in" };
  }
}

// ============================================
// NEW PHONE PIN AUTHENTICATION
// ============================================

// Create phone account with 4-digit PIN
export async function createPhoneAccount(params: CreatePhoneAccountParams) {
  try {
    if (!isFirebaseAvailable()) {
      return { success: false, message: "System error" };
    }

    const { name, phone, pin } = params;

    // Validate PIN is exactly 4 digits
    if (!/^\d{4}$/.test(pin)) {
      return { success: false, message: "PIN must be exactly 4 digits" };
    }

    // Check if phone already exists
    const existingUser = await db.collection("users")
      .where("phone", "==", phone)
      .get();

    if (!existingUser.empty) {
      return { success: false, message: "Phone number already registered" };
    }

    // Create a random email for Firebase Auth
    const tempEmail = `phone_${Date.now()}@phone.user`;

    // FIX: Pad the PIN to make it 6 characters for Firebase Auth
    // Add a fixed prefix to make it 6+ characters while keeping the PIN recognizable
    const firebasePassword = `pin_${pin}`; // This makes "pin_6666" which is 8 characters

    // Create Firebase Auth user with padded password
    const userRecord = await auth.createUser({
      email: tempEmail,
      password: firebasePassword,
      displayName: name,
    });

    // Store user in Firestore with original 4-digit PIN
    await db.collection("users").doc(userRecord.uid).set({
      name,
      email: tempEmail,
      phone,
      pin, // Store original 4-digit PIN for verification
      authMethod: "phone",
      createdAt: new Date().toISOString(),
    });

    return { success: true, message: "Phone account created" };
  } catch (error: any) {
    console.error("Phone signup error:", error);
    return { success: false, message: error.message || "Failed to create account" };
  }
}

// Sign in with phone and PIN (with timing logs)
export async function signInWithPhone(params: SignInWithPhoneParams) {
  console.time('signin-with-phone-total');
  try {
    if (!isFirebaseAvailable()) {
      console.timeEnd('signin-with-phone-total');
      return { success: false, message: "System error" };
    }

    const { phone, pin } = params;

    if (!/^\d{4}$/.test(pin)) {
      console.timeEnd('signin-with-phone-total');
      return { success: false, message: "PIN must be exactly 4 digits" };
    }

    console.time('firestore-query');
    const userSnapshot = await db.collection("users")
      .where("phone", "==", phone)
      .limit(1)
      .get();
    console.timeEnd('firestore-query');

    if (userSnapshot.empty) {
      console.timeEnd('signin-with-phone-total');
      return { success: false, message: "Phone number not registered" };
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    if (userData.pin !== pin) {
      console.timeEnd('signin-with-phone-total');
      return { success: false, message: "Invalid PIN" };
    }

    // If you have any other async operations, wrap them with timers too

    console.timeEnd('signin-with-phone-total');
    return {
      success: true,
      message: "Phone verified",
      userId: userDoc.id,
      email: userData.email,
      password: `pin_${pin}`
    };
  } catch (error: any) {
    console.timeEnd('signin-with-phone-total');
    console.error("Phone signin error:", error);
    return { success: false, message: error.message || "Failed to sign in" };
  }
}

// Find user by phone number (helper for client)
export async function findUserByPhone(phone: string) {
  try {
    if (!isFirebaseAvailable()) return null;

    const cleanPhone = phone.replace(/[\s-]/g, '');

    const snapshot = await db.collection("users")
      .where("phone", "==", cleanPhone)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const userDoc = snapshot.docs[0];
    return {
      uid: userDoc.id,
      ...userDoc.data()
    };
  } catch {
    return null;
  }
}

// ============================================
// COMMON FUNCTIONS (UPDATED)
// ============================================

// Get current user from session cookie
export async function getCurrentUser() {
  try {
    if (!isFirebaseAvailable()) return null;

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) return null;

    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    const userRecord = await db.collection("users").doc(decodedClaims.uid).get();

    if (!userRecord.exists) return null;

    return { id: userRecord.id, ...userRecord.data() };
  } catch {
    return null;
  }
}

// Sign out
export async function signOut() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session");
  } catch {
    // Ignore
  }
}

// Check if user is authenticated
export async function isAuthenticated() {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch {
    return false;
  }
}

// Alternative simple auth check
export async function checkAuthSimple() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    return !!sessionCookie;
  } catch {
    return false;
  }
}

// ============================================
// INTERVIEW FUNCTIONS (UNCHANGED)
// ============================================

export async function getInterviewById(id: string) {
  try {
    if (!isFirebaseAvailable()) return null;

    const interview = await db.collection("interviews").doc(id).get();
    return interview.exists ? interview.data() : null;
  } catch {
    return null;
  }
}

export async function getFeedbackByInterviewId(params: any) {
  try {
    if (!isFirebaseAvailable()) return null;

    const { interviewId, userId } = params;
    const querySnapshot = await db.collection("feedback")
      .where("interviewId", "==", interviewId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch {
    return null;
  }
}

export async function getInterviewsByUserId(userId?: string) {
  try {
    if (!userId || !isFirebaseAvailable()) return [];

    const interviews = await db.collection("interviews")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return interviews.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch {
    return [];
  }
}

export async function getLatestInterviews(params: any) {
  try {
    const { userId, limit = 20 } = params;
    if (!userId || !isFirebaseAvailable()) return [];

    const interviews = await db.collection("interviews")
      .where("finalized", "==", true)
      .where("userId", "!=", userId)
      .orderBy("userId")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return interviews.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch {
    return [];
  }
}