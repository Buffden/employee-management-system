package com.ems.employee_management_system.mappers;

import com.ems.employee_management_system.dtos.EmployeeProjectRequestDTO;
import com.ems.employee_management_system.dtos.EmployeeProjectResponseDTO;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.EmployeeProject;
import com.ems.employee_management_system.models.Project;

public class EmployeeProjectMapper {
    /**
     * Converts EmployeeProject entity to EmployeeProjectResponseDTO
     * Includes denormalized names for better API responses
     */
    public static EmployeeProjectResponseDTO toResponseDTO(EmployeeProject ep) {
        if (ep == null) {
            return null;
        }
        
        EmployeeProjectResponseDTO dto = new EmployeeProjectResponseDTO();
        dto.setEmployeeId(ep.getEmployee() != null ? ep.getEmployee().getId() : null);
        dto.setProjectId(ep.getProject() != null ? ep.getProject().getId() : null);
        dto.setRole(ep.getRole());
        dto.setAssignedDate(ep.getAssignedDate());
        
        // Denormalized names for better API responses
        if (ep.getEmployee() != null) {
            String employeeFullName = ep.getEmployee().getFirstName() + " " + ep.getEmployee().getLastName();
            dto.setEmployeeName(employeeFullName);
        } else {
            dto.setEmployeeName(null);
        }
        dto.setProjectName(ep.getProject() != null ? ep.getProject().getName() : null);
        
        return dto;
    }

    /**
     * Converts EmployeeProjectRequestDTO to EmployeeProject entity
     * Relationships are resolved by IDs in the controller layer
     */
    public static EmployeeProject toEntity(EmployeeProjectRequestDTO dto, Employee employee, Project project) {
        if (dto == null) {
            return null;
        }
        
        EmployeeProject ep = new EmployeeProject();
        ep.setEmployee(employee);
        ep.setProject(project);
        ep.setRole(dto.getRole());
        ep.setAssignedDate(dto.getAssignedDate());
        return ep;
    }
} 