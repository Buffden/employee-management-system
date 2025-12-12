package com.ems.employee_management_system.dtos;

/**
 * DTO for filter options in paginated responses
 * Used to provide filter dropdown options for table filtering
 * 
 * IMPORTANT: Filter options should ALWAYS contain ALL possible values, independent of pagination.
 * Filters represent complete filter options available for the table, not filtered by current page.
 * Filters only narrow down when other filters are applied (future filtering implementation).
 */
public class FilterOptionDTO {
    private String id;
    private String label;
    private String value; // Optional: for additional display information

    public FilterOptionDTO() {
    }

    public FilterOptionDTO(String id, String label) {
        this.id = id;
        this.label = label;
    }

    public FilterOptionDTO(String id, String label, String value) {
        this.id = id;
        this.label = label;
        this.value = value;
    }

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}

