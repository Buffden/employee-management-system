package com.ems.employee_management_system.mappers;

import com.ems.employee_management_system.dtos.ProjectRequestDTO;
import com.ems.employee_management_system.dtos.ProjectResponseDTO;
import com.ems.employee_management_system.models.Department;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.Project;

public class ProjectMapper {
    /**
     * Converts Project entity to ProjectResponseDTO
     * Includes denormalized names for better API responses
     */
    public static ProjectResponseDTO toResponseDTO(Project project) {
        if (project == null) {
            return null;
        }
        
        ProjectResponseDTO dto = new ProjectResponseDTO();
        dto.setId(project.getId());
        dto.setName(project.getName());
        dto.setDescription(project.getDescription());
        dto.setStartDate(project.getStartDate());
        dto.setEndDate(project.getEndDate());
        dto.setStatus(project.getStatus());
        dto.setBudget(project.getBudget());
        
        // Denormalized names for better API responses
        dto.setDepartmentName(project.getDepartment() != null ? project.getDepartment().getName() : null);
        if (project.getProjectManager() != null) {
            String managerFullName = project.getProjectManager().getFirstName() + " " + project.getProjectManager().getLastName();
            dto.setProjectManagerName(managerFullName);
        } else {
            dto.setProjectManagerName(null);
        }
        
        return dto;
    }

    /**
     * Converts ProjectRequestDTO to Project entity
     * Relationships are resolved by IDs in the controller layer
     */
    public static Project toEntity(ProjectRequestDTO dto, Department department, Employee projectManager) {
        if (dto == null) {
            return null;
        }
        
        Project project = new Project();
        project.setName(dto.getName());
        project.setDescription(dto.getDescription());
        project.setStartDate(dto.getStartDate());
        project.setEndDate(dto.getEndDate());
        project.setStatus(dto.getStatus());
        project.setBudget(dto.getBudget());
        project.setDepartment(department);
        project.setProjectManager(projectManager);
        return project;
    }
} 