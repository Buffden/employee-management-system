package com.ems.employee_management_system.enums;

/**
 * User role enumeration
 * Defines all available roles in the system
 */
public enum UserRole {
    SYSTEM_ADMIN("SYSTEM_ADMIN"),
    HR_MANAGER("HR_MANAGER"),
    DEPARTMENT_MANAGER("DEPARTMENT_MANAGER"),
    EMPLOYEE("EMPLOYEE");

    private final String value;

    UserRole(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    /**
     * Convert string to UserRole enum
     * @param role String role value
     * @return UserRole enum or null if not found
     */
    public static UserRole fromString(String role) {
        if (role == null) {
            return null;
        }
        for (UserRole userRole : UserRole.values()) {
            if (userRole.value.equalsIgnoreCase(role)) {
                return userRole;
            }
        }
        return null;
    }

    /**
     * Check if a string is a valid role
     * @param role String to check
     * @return true if valid role
     */
    public static boolean isValid(String role) {
        return fromString(role) != null;
    }
}

