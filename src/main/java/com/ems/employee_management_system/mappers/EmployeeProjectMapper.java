package com.ems.employee_management_system.mappers;

import com.ems.employee_management_system.dtos.EmployeeProjectDTO;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.EmployeeProject;
import com.ems.employee_management_system.models.Project;

public class EmployeeProjectMapper {
    public static EmployeeProjectDTO toDTO(EmployeeProject ep) {
        EmployeeProjectDTO dto = new EmployeeProjectDTO();
        dto.setEmployeeId(ep.getEmployee() != null ? ep.getEmployee().getId() : null);
        dto.setProjectId(ep.getProject() != null ? ep.getProject().getId() : null);
        dto.setRole(ep.getRole());
        dto.setAssignedDate(ep.getAssignedDate());
        return dto;
    }

    public static EmployeeProject toEntity(EmployeeProjectDTO dto, Employee employee, Project project) {
        EmployeeProject ep = new EmployeeProject();
        ep.setEmployee(employee);
        ep.setProject(project);
        ep.setRole(dto.getRole());
        ep.setAssignedDate(dto.getAssignedDate());
        return ep;
    }
} 