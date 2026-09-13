/**
 * Authentication related constants.
 */

export const AUTH_METHOD = {
  EMAIL: "email",
  PHONE: "phone",
} as const;

export const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days

export const PHONE_PIN_LENGTH = 4;

export const FIREBASE_PASSWORD_PREFIX = "pin_";