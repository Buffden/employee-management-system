package com.ems.employee_management_system.constants;

/**
 * Constants for user roles
 * Provides string constants for use in annotations and other places requiring compile-time constants
 * These values must match the UserRole enum values exactly
 */
public final class RoleConstants {
    private RoleConstants() {
        throw new UnsupportedOperationException("Constants class cannot be instantiated");
    }

    // Role string constants (for use in @PreAuthorize annotations)
    // These are compile-time constants (string literals) for use in annotations
    public static final String SYSTEM_ADMIN = "SYSTEM_ADMIN";
    public static final String HR_MANAGER = "HR_MANAGER";
    public static final String DEPARTMENT_MANAGER = "DEPARTMENT_MANAGER";
    public static final String EMPLOYEE = "EMPLOYEE";

    // Role arrays for hasAnyRole
    public static final String[] ALL_ROLES = {
        SYSTEM_ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE
    };

    public static final String[] ADMIN_ROLES = {
        SYSTEM_ADMIN, HR_MANAGER
    };

    public static final String[] MANAGER_ROLES = {
        SYSTEM_ADMIN, HR_MANAGER, DEPARTMENT_MANAGER
    };
}

