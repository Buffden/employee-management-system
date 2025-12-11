package com.ems.employee_management_system.models;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
@IdClass(EmployeeProject.EmployeeProjectId.class)
public class EmployeeProject {
    @Id
    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @Id
    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;

    private String role;
    private LocalDate assignedDate;

    // Composite key class
    public static class EmployeeProjectId implements Serializable {
        private UUID employee;
        private UUID project;
        public EmployeeProjectId() {}
        public EmployeeProjectId(UUID employee, UUID project) {
            this.employee = employee;
            this.project = project;
        }
        // Getters
        public UUID getEmployee() { return employee; }
        public UUID getProject() { return project; }
        // Setters
        public void setEmployee(UUID employee) { this.employee = employee; }
        public void setProject(UUID project) { this.project = project; }
        // equals and hashCode
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            EmployeeProjectId that = (EmployeeProjectId) o;
            return employee.equals(that.employee) && project.equals(that.project);
        }
        @Override
        public int hashCode() {
            return employee.hashCode() + project.hashCode();
        }
    }

    // Getters and setters
    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public LocalDate getAssignedDate() { return assignedDate; }
    public void setAssignedDate(LocalDate assignedDate) { this.assignedDate = assignedDate; }
} 