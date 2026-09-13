"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

// Session duration: 1 week
const SESSION_DURATION = 60 * 60 * 24 * 7;

// Check if Firebase Admin is available
function isFirebaseAvailable() {
  return !!(auth && db);
}

// ============================================================
// SESSION COOKIE
// ============================================================

export async function setSessionCookie(idToken: string) {
  try {
    if (!isFirebaseAvailable()) {
      console.error("Firebase Admin is not available.");
      return false;
    }

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

    console.log("Session cookie created successfully.");

    return true;
  } catch (error) {
    console.error("Failed to create session cookie:", error);
    return false;
  }
}

// ============================================================
// TYPE DEFINITIONS
// ============================================================

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

interface CreatePhoneAccountParams {
  name: string;
  phone: string;
  pin: string;
}

interface SignInWithPhoneParams {
  phone: string;
  pin: string;
}

// ============================================================
// EMAIL AUTHENTICATION
// ============================================================

export async function signUp(params: SignUpParams) {
  try {
    if (!isFirebaseAvailable()) {
      return {
        success: false,
        message: "System error",
      };
    }

    const { uid, name, email, phone } = params;

    const userRecord = await db
      .collection("users")
      .doc(uid)
      .get();

    if (userRecord.exists) {
      return {
        success: false,
        message: "User already exists",
      };
    }

    await db
      .collection("users")
      .doc(uid)
      .set({
        name,
        email,
        phone: phone || null,
        authMethod: "email",
        createdAt: new Date().toISOString(),
      });

    return {
      success: true,
      message: "Account created",
    };
  } catch (error) {
    console.error("Sign up error:", error);

    return {
      success: false,
      message: "Failed to create account",
    };
  }
}

export async function signIn(params: SignInParams) {
  try {
    if (!isFirebaseAvailable()) {
      return {
        success: false,
        message: "System error",
      };
    }

    const { email, idToken } = params;

    const userRecord = await auth.getUserByEmail(email);

    if (!userRecord) {
      return {
        success: false,
        message: "User does not exist",
      };
    }

    const sessionCreated = await setSessionCookie(idToken);

    if (!sessionCreated) {
      return {
        success: false,
        message: "Failed to create authentication session",
      };
    }

    return {
      success: true,
      message: "Signed in",
      userId: userRecord.uid,
    };
  } catch (error) {
    console.error("Sign in error:", error);

    return {
      success: false,
      message: "Failed to sign in",
    };
  }
}

// ============================================================
// PHONE PIN AUTHENTICATION
// ============================================================

export async function createPhoneAccount(
  params: CreatePhoneAccountParams
) {
  try {
    if (!isFirebaseAvailable()) {
      return {
        success: false,
        message: "System error",
      };
    }

    const { name, phone, pin } = params;

    if (!/^\d{4}$/.test(pin)) {
      return {
        success: false,
        message: "PIN must be exactly 4 digits",
      };
    }

    const existingUser = await db
      .collection("users")
      .where("phone", "==", phone)
      .get();

    if (!existingUser.empty) {
      return {
        success: false,
        message: "Phone number already registered",
      };
    }

    const tempEmail = `phone_${Date.now()}@phone.user`;

    const firebasePassword = `pin_${pin}`;

    const userRecord = await auth.createUser({
      email: tempEmail,
      password: firebasePassword,
      displayName: name,
    });

    await db
      .collection("users")
      .doc(userRecord.uid)
      .set({
        name,
        email: tempEmail,
        phone,
        pin,
        authMethod: "phone",
        createdAt: new Date().toISOString(),
      });

    return {
      success: true,
      message: "Phone account created",
    };
  } catch (error: any) {
    console.error("Phone signup error:", error);

    return {
      success: false,
      message:
        error?.message || "Failed to create account",
    };
  }
}

export async function signInWithPhone(
  params: SignInWithPhoneParams
) {
  console.time("signin-with-phone-total");

  try {
    if (!isFirebaseAvailable()) {
      console.timeEnd("signin-with-phone-total");

      return {
        success: false,
        message: "System error",
      };
    }

    const { phone, pin } = params;

    if (!/^\d{4}$/.test(pin)) {
      console.timeEnd("signin-with-phone-total");

      return {
        success: false,
        message: "PIN must be exactly 4 digits",
      };
    }

    console.time("firestore-query");

    const userSnapshot = await db
      .collection("users")
      .where("phone", "==", phone)
      .limit(1)
      .get();

    console.timeEnd("firestore-query");

    if (userSnapshot.empty) {
      console.timeEnd("signin-with-phone-total");

      return {
        success: false,
        message: "Phone number not registered",
      };
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    if (userData.pin !== pin) {
      console.timeEnd("signin-with-phone-total");

      return {
        success: false,
        message: "Invalid PIN",
      };
    }

    console.timeEnd("signin-with-phone-total");

    return {
      success: true,
      message: "Phone verified",
      userId: userDoc.id,
      email: userData.email,
      password: `pin_${pin}`,
    };
  } catch (error: any) {
    console.timeEnd("signin-with-phone-total");

    console.error("Phone signin error:", error);

    return {
      success: false,
      message:
        error?.message || "Failed to sign in",
    };
  }
}

// ============================================================
// FIND USER BY PHONE
// ============================================================

export async function findUserByPhone(phone: string) {
  try {
    if (!isFirebaseAvailable()) {
      return null;
    }

    const cleanPhone = phone.replace(/[\s-]/g, "");

    const snapshot = await db
      .collection("users")
      .where("phone", "==", cleanPhone)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const userDoc = snapshot.docs[0];

    return {
      uid: userDoc.id,
      ...userDoc.data(),
    };
  } catch (error) {
    console.error("findUserByPhone error:", error);
    return null;
  }
}

// ============================================================
// GET CURRENT USER
// ============================================================

export async function getCurrentUser() {
  try {
    if (!isFirebaseAvailable()) {
      console.error("Firebase Admin is not available.");
      return null;
    }

    const cookieStore = await cookies();

    const sessionCookie =
      cookieStore.get("session")?.value;

    if (!sessionCookie) {
      console.error("No session cookie found.");
      return null;
    }

    const decodedClaims =
      await auth.verifySessionCookie(
        sessionCookie,
        true
      );

    const userRecord = await db
      .collection("users")
      .doc(decodedClaims.uid)
      .get();

    if (!userRecord.exists) {
      console.error(
        "Firebase user does not exist in Firestore:",
        decodedClaims.uid
      );

      return null;
    }

    return {
      id: userRecord.id,
      ...userRecord.data(),
    };
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}

// ============================================================
// SIGN OUT
// ============================================================

export async function signOut() {
  try {
    const cookieStore = await cookies();

    cookieStore.delete("session");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Sign out error:", error);

    return {
      success: false,
    };
  }
}

// ============================================================
// AUTHENTICATION CHECKS
// ============================================================

export async function isAuthenticated() {
  try {
    const user = await getCurrentUser();

    return !!user;
  } catch (error) {
    console.error("isAuthenticated error:", error);

    return false;
  }
}

export async function checkAuthSimple() {
  try {
    const cookieStore = await cookies();

    const sessionCookie =
      cookieStore.get("session")?.value;

    return !!sessionCookie;
  } catch (error) {
    console.error("checkAuthSimple error:", error);

    return false;
  }
}

// ============================================================
// INTERVIEW FUNCTIONS
// ============================================================

export async function getInterviewById(id: string) {
  try {
    if (!isFirebaseAvailable()) {
      return null;
    }

    const interview = await db
      .collection("interviews")
      .doc(id)
      .get();

    return interview.exists
      ? interview.data()
      : null;
  } catch (error) {
    console.error("getInterviewById error:", error);

    return null;
  }
}

export async function getFeedbackByInterviewId(
  params: any
) {
  try {
    if (!isFirebaseAvailable()) {
      return null;
    }

    const { interviewId, userId } = params;

    const querySnapshot = await db
      .collection("feedback")
      .where("interviewId", "==", interviewId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];

    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error(
      "getFeedbackByInterviewId error:",
      error
    );

    return null;
  }
}

export async function getInterviewsByUserId(
  userId?: string
) {
  try {
    if (!userId || !isFirebaseAvailable()) {
      return [];
    }

    const interviews = await db
      .collection("interviews")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return interviews.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error(
      "getInterviewsByUserId error:",
      error
    );

    return [];
  }
}

export async function getLatestInterviews(
  params: any
) {
  try {
    const { userId, limit = 20 } = params;

    if (!userId || !isFirebaseAvailable()) {
      return [];
    }

    const interviews = await db
      .collection("interviews")
      .where("finalized", "==", true)
      .where("userId", "!=", userId)
      .orderBy("userId")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return interviews.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error(
      "getLatestInterviews error:",
      error
    );

    return [];
  }
}