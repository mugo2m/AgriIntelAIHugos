/**
 * Common application messages.
 */

export const MESSAGES = {
  ACCOUNT_CREATED: "Account created successfully.",
  ACCOUNT_EXISTS: "Account already exists.",

  SIGN_IN_SUCCESS: "Signed in successfully.",
  SIGN_OUT_SUCCESS: "Signed out successfully.",

  PHONE_ACCOUNT_CREATED:
    "Phone account created successfully. Please sign in.",

  INVALID_PIN: "Invalid PIN.",

  USER_NOT_FOUND: "User not found.",

  DEFAULT_ROLE_MISSING:
    "Default role 'Farmer' does not exist.",

  AUTH_SYNC_FAILED:
    "Failed to synchronize your account.",
} as const;