import { isAxiosError } from "axios";

/**
 * Pulls a human-readable message out of an unknown thrown value.
 *
 * Assumes the API returns errors shaped as `{ message: string }`; adjust the
 * narrowing below if your backend uses a different envelope.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)
      ?.message;
    if (message) return message;
  }

  if (error instanceof Error && error.message) return error.message;

  return fallback;
}
