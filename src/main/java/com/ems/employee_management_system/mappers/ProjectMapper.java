package com.ems.employee_management_system.mappers;

import com.ems.employee_management_system.dtos.ProjectDTO;
import com.ems.employee_management_system.models.Department;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.Project;

public class ProjectMapper {
    public static ProjectDTO toDTO(Project project) {
        ProjectDTO dto = new ProjectDTO();
        dto.setId(project.getId());
        dto.setName(project.getName());
        dto.setDescription(project.getDescription());
        dto.setStartDate(project.getStartDate());
        dto.setEndDate(project.getEndDate());
        dto.setStatus(project.getStatus());
        dto.setBudget(project.getBudget());
        dto.setDepartmentId(project.getDepartment() != null ? project.getDepartment().getId() : null);
        dto.setProjectManagerId(project.getProjectManager() != null ? project.getProjectManager().getId() : null);
        return dto;
    }

    public static Project toEntity(ProjectDTO dto, Department department, Employee projectManager) {
        Project project = new Project();
        project.setId(dto.getId());
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