/** Single source of truth for app-level branding. */
export const APP_NAME = "CritPath";

/**
 * Sign-in is disconnected: every page is public, no session is loaded at startup and the account
 * menu has no log out. The auth pages, guards, store and service are all kept; set this to `true`
 * to wire them back in.
 */
export const AUTH_ENABLED = false;
