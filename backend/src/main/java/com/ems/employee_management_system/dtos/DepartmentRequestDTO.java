package com.ems.employee_management_system.dtos;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public class DepartmentRequestDTO {
    @NotBlank(message = "Department name is required")
    @Size(max = 100, message = "Department name must not exceed 100 characters")
    private String name;
    
    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;
    
    @NotNull(message = "Location ID is required")
    private UUID locationId;
    
    @PositiveOrZero(message = "Budget must be positive or zero")
    private Double budget;
    
    @PositiveOrZero(message = "Budget utilization must be positive or zero")
    private Double budgetUtilization;
    
    @PositiveOrZero(message = "Performance metric must be positive or zero")
    private Double performanceMetric;
    
    private UUID departmentHeadId;

    // Getters and setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public UUID getLocationId() {
        return locationId;
    }

    public void setLocationId(UUID locationId) {
        this.locationId = locationId;
    }

    public Double getBudget() {
        return budget;
    }

    public void setBudget(Double budget) {
        this.budget = budget;
    }

    public Double getBudgetUtilization() {
        return budgetUtilization;
    }

    public void setBudgetUtilization(Double budgetUtilization) {
        this.budgetUtilization = budgetUtilization;
    }

    public Double getPerformanceMetric() {
        return performanceMetric;
    }

    public void setPerformanceMetric(Double performanceMetric) {
        this.performanceMetric = performanceMetric;
    }

    public UUID getDepartmentHeadId() {
        return departmentHeadId;
    }

    public void setDepartmentHeadId(UUID departmentHeadId) {
        this.departmentHeadId = departmentHeadId;
    }
}
