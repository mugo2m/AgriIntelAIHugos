import { getCurrentUser } from "@/lib/actions/auth.action";

// List of admin emails - CHANGE THIS TO YOUR EMAIL
const ADMIN_EMAILS = ["mugomuiruri08@gmail.com"]; // Replace with your actual email

/**
 * Check if current user is an admin
 * @returns {Promise<boolean>} True if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.email) return false;

    // Check if user's email is in admin list
    return ADMIN_EMAILS.includes(user.email);
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Require admin access - throws error if not admin
 * @returns {Promise<boolean>} True if admin
 * @throws {Error} If not authorized
 */
export async function requireAdmin(): Promise<boolean> {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error("Unauthorized: Admin access required");
  }
  return true;
}

/**
 * Get admin email list (useful for debugging)
 * @returns {string[]} List of admin emails
 */
export function getAdminEmails(): string[] {
  return [...ADMIN_EMAILS];
}

/**
 * Check if a specific email is admin
 * @param email Email to check
 * @returns {boolean} True if email is admin
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email);
}