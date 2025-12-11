package com.ems.employee_management_system.utils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Utility class for hashing operations
 * Matches frontend hashing implementation
 */
public final class HashUtil {
    
    // Private constructor to prevent instantiation
    private HashUtil() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }
    
    private static final String SALT_PREFIX_PASSWORD = "ems_";
    private static final String SALT_SUFFIX_PASSWORD = "_salt";
    private static final String SALT_PREFIX_USERNAME = "ems_user_";
    
    /**
     * Hash a string using SHA-256
     * @param input The string to hash
     * @return Hex-encoded SHA-256 hash
     */
    public static String hashSHA256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            
            // Convert bytes to hex string
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
    
    /**
     * Hash password using the same method as frontend
     * @param password Plain text password
     * @return Hashed password
     */
    public static String hashPassword(String password) {
        String saltedPassword = SALT_PREFIX_PASSWORD + password + SALT_SUFFIX_PASSWORD;
        return hashSHA256(saltedPassword);
    }
    
    /**
     * Hash username/user ID using the same method as frontend
     * @param userId Username or user identifier
     * @return Hashed user ID
     */
    public static String hashUserId(String userId) {
        String saltedUserId = SALT_PREFIX_USERNAME + userId;
        return hashSHA256(saltedUserId);
    }
    
    /**
     * Check if a string looks like a hash (hex string of 64 characters for SHA-256)
     * @param input String to check
     * @return true if it looks like a hash
     */
    public static boolean isHash(String input) {
        if (input == null || input.length() != 64) {
            return false;
        }
        // Check if it's a valid hex string
        return input.matches("[0-9a-f]{64}");
    }
}

