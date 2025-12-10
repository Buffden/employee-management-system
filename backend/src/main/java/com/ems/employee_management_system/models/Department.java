package com.ems.employee_management_system.models;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;

@Entity
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    @ManyToOne
    private Location location;

    @Column(nullable = false)
    private LocalDate createdAt;

    private Double budget = 0.0;
    private Double budgetUtilization; // 0-1.0
    private Double performanceMetric; // 0-100

    @ManyToOne
    private Employee departmentHead;

    // Denormalized field for display purposes. Must be kept in sync with location.name
    private String locationName;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

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

    public LocalDate getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDate createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getTotalEmployees() {
        return totalEmployees;
    }

    public void setTotalEmployees(Integer totalEmployees) {
        this.totalEmployees = totalEmployees;
    }

    public List<Employee> getEmployees() {
        return employees;
    }

    public void setEmployees(List<Employee> employees) {
        this.employees = employees;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public Location getLocation() {
        return location;
    }

    public void setLocation(Location location) {
        this.location = location;
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

    public Employee getHead() {
        return departmentHead;
    }

    public void setHead(Employee head) {
        this.departmentHead = head;
    }

    private Integer totalEmployees;

    @OneToMany(mappedBy = "department")
    @JsonIgnore
    private List<Employee> employees;

    public Department() {}

    // Parameterized constructor for convenience
    public Department(String name, String description, Integer totalEmployees) {
        this.name = name;
        this.description = description;
        this.totalEmployees = totalEmployees;
    }
}
