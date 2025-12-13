package com.ems.employee_management_system.mappers;

import java.time.LocalDate;

import com.ems.employee_management_system.dtos.DepartmentRequestDTO;
import com.ems.employee_management_system.dtos.DepartmentResponseDTO;
import com.ems.employee_management_system.models.Department;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.Location;

public class DepartmentMapper {
    /**
     * Converts Department entity to DepartmentResponseDTO
     * Includes denormalized names for better API responses
     */
    public static DepartmentResponseDTO toResponseDTO(Department department) {
        if (department == null) {
            return null;
        }
        
        DepartmentResponseDTO dto = new DepartmentResponseDTO();
        dto.setId(department.getId());
        dto.setName(department.getName());
        dto.setDescription(department.getDescription());
        if (department.getLocation() != null) {
            dto.setLocationId(department.getLocation().getId());
        }
        dto.setLocationName(department.getLocationName());
        dto.setCreatedAt(department.getCreatedAt());
        dto.setBudget(department.getBudget());
        dto.setBudgetUtilization(department.getBudgetUtilization());
        dto.setPerformanceMetric(department.getPerformanceMetric());
        
        // Denormalized department head name
        if (department.getHead() != null) {
            String headFullName = department.getHead().getFirstName() + " " + department.getHead().getLastName();
            dto.setDepartmentHeadName(headFullName);
        } else {
            dto.setDepartmentHeadName(null);
        }
        
        return dto;
    }

    /**
     * Converts DepartmentRequestDTO to Department entity
     * Relationships are resolved by IDs in the controller layer
     */
    public static Department toEntity(DepartmentRequestDTO dto, Location location, Employee head) {
        if (dto == null) {
            return null;
        }
        
        Department department = new Department();
        department.setName(dto.getName());
        // Handle description - allow null/empty for optional field
        if (dto.getDescription() != null && !dto.getDescription().trim().isEmpty()) {
            department.setDescription(dto.getDescription().trim());
        } else {
            department.setDescription(null);
        }
        department.setLocation(location);
        if (location != null) {
            department.setLocationName(location.getName());
        }
        // Handle optional numeric fields - only set if not null
        department.setBudget(dto.getBudget());
        department.setBudgetUtilization(dto.getBudgetUtilization());
        department.setPerformanceMetric(dto.getPerformanceMetric());
        department.setHead(head);
        // Always set createdAt for new departments (id will be null for new entities)
        department.setCreatedAt(LocalDate.now());
        return department;
    }
} 