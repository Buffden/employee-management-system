package com.ems.employee_management_system.dtos;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO for project query requests with pagination and sorting
 * Used for POST /api/projects/query endpoint
 */
public class ProjectQueryRequestDTO {
    @Min(value = 0, message = "Page number must be non-negative")
    private int page = 0;

    @Min(value = 1, message = "Page size must be at least 1")
    private int size = 20;

    @Size(max = 50, message = "Sort by field must not exceed 50 characters")
    private String sortBy;

    @Pattern(regexp = "ASC|DESC", message = "Sort direction must be 'ASC' or 'DESC'")
    private String sortDir = "ASC";

    // Getters and setters
    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public String getSortBy() {
        return sortBy;
    }

    public void setSortBy(String sortBy) {
        this.sortBy = sortBy;
    }

    public String getSortDir() {
        return sortDir;
    }

    public void setSortDir(String sortDir) {
        this.sortDir = sortDir;
    }
}

