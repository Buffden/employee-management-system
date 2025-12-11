/**
 * Utility for hashing sensitive data before sending to backend
 * Uses Web Crypto API for secure hashing
 */

/**
 * Hash a string using SHA-256
 * @param data The string to hash
 * @returns Promise resolving to the hex-encoded hash
 */
export async function hashString(data: string): Promise<string> {
  // Convert string to ArrayBuffer
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Hash using Web Crypto API
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Hash password before sending to backend
 * @param password Plain text password
 * @returns Promise resolving to hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  // Add a salt/prefix to make it harder to reverse (though backend will hash again)
  const saltedPassword = `ems_${password}_salt`;
  return hashString(saltedPassword);
}

/**
 * Hash user identifier (username) before sending to backend
 * @param userId Username or user identifier
 * @returns Promise resolving to hashed user ID
 */
export async function hashUserId(userId: string): Promise<string> {
  const saltedUserId = `ems_user_${userId}`;
  return hashString(saltedUserId);
}

/**
 * Hash multiple values and combine them
 * @param values Array of strings to hash
 * @returns Promise resolving to combined hash
 */
export async function hashMultiple(...values: string[]): Promise<string> {
  const combined = values.join('|');
  return hashString(combined);
}

