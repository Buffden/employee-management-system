package com.ems.employee_management_system.dtos;

import java.time.LocalDate;
import java.util.UUID;

public class DepartmentDTO {
    private UUID id;
    private String name;
    private String description;
    private String locationName;
    private UUID locationId;
    // Denormalized field for display purposes
    private String location;
    private LocalDate createdAt;
    private Double budget;
    private Double budgetUtilization;
    private Double performanceMetric;
    private UUID departmentHeadId;
    // getters and setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }
    public UUID getLocationId() { return locationId; }
    public void setLocationId(UUID locationId) { this.locationId = locationId; }
    public LocalDate getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDate createdAt) { this.createdAt = createdAt; }
    public Double getBudget() { return budget; }
    public void setBudget(Double budget) { this.budget = budget; }
    public Double getBudgetUtilization() { return budgetUtilization; }
    public void setBudgetUtilization(Double budgetUtilization) { this.budgetUtilization = budgetUtilization; }
    public Double getPerformanceMetric() { return performanceMetric; }
    public void setPerformanceMetric(Double performanceMetric) { this.performanceMetric = performanceMetric; }
    public UUID getDepartmentHeadId() { return departmentHeadId; }
    public void setDepartmentHeadId(UUID departmentHeadId) { this.departmentHeadId = departmentHeadId; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
} 