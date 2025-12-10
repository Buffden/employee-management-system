package com.ems.employee_management_system.dtos;

import java.time.LocalDate;
import java.util.UUID;

public class EmployeeProjectDTO {
    private UUID employeeId;
    private UUID projectId;
    private String role;
    private LocalDate assignedDate;
    // getters and setters
    public UUID getEmployeeId() { return employeeId; }
    public void setEmployeeId(UUID employeeId) { this.employeeId = employeeId; }
    public UUID getProjectId() { return projectId; }
    public void setProjectId(UUID projectId) { this.projectId = projectId; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public LocalDate getAssignedDate() { return assignedDate; }
    public void setAssignedDate(LocalDate assignedDate) { this.assignedDate = assignedDate; }
} 