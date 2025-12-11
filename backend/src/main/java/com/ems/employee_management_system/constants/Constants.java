package com.ems.employee_management_system.constants;

/**
 * Constants class for magic strings used across the application
 * Follows industrial best practice of centralizing constants
 */
public final class Constants {
    
    private Constants() {
        // Prevent instantiation
    }
    
    // Project Status Values
    public static final String PROJECT_STATUS_PLANNING = "Planning";
    public static final String PROJECT_STATUS_ACTIVE = "Active";
    public static final String PROJECT_STATUS_ON_HOLD = "On Hold";
    public static final String PROJECT_STATUS_COMPLETED = "Completed";
    public static final String PROJECT_STATUS_CANCELLED = "Cancelled";
    
    public static final String[] VALID_PROJECT_STATUSES = {
        PROJECT_STATUS_PLANNING,
        PROJECT_STATUS_ACTIVE,
        PROJECT_STATUS_ON_HOLD,
        PROJECT_STATUS_COMPLETED,
        PROJECT_STATUS_CANCELLED
    };
    
    // Task Status Values
    public static final String TASK_STATUS_NOT_STARTED = "Not Started";
    public static final String TASK_STATUS_IN_PROGRESS = "In Progress";
    public static final String TASK_STATUS_ON_HOLD = "On Hold";
    public static final String TASK_STATUS_COMPLETED = "Completed";
    public static final String TASK_STATUS_CANCELLED = "Cancelled";
    
    public static final String[] VALID_TASK_STATUSES = {
        TASK_STATUS_NOT_STARTED,
        TASK_STATUS_IN_PROGRESS,
        TASK_STATUS_ON_HOLD,
        TASK_STATUS_COMPLETED,
        TASK_STATUS_CANCELLED
    };
    
    // Task Priority Values
    public static final String TASK_PRIORITY_LOW = "Low";
    public static final String TASK_PRIORITY_MEDIUM = "Medium";
    public static final String TASK_PRIORITY_HIGH = "High";
    public static final String TASK_PRIORITY_URGENT = "Urgent";
    
    public static final String[] VALID_TASK_PRIORITIES = {
        TASK_PRIORITY_LOW,
        TASK_PRIORITY_MEDIUM,
        TASK_PRIORITY_HIGH,
        TASK_PRIORITY_URGENT
    };
    
    // Default Location Country
    public static final String DEFAULT_COUNTRY = "India";
    
    // Pagination Defaults
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;
}

