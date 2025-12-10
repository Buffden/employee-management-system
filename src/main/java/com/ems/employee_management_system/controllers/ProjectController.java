package com.ems.employee_management_system.controllers;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ems.employee_management_system.dtos.ProjectDTO;
import com.ems.employee_management_system.mappers.ProjectMapper;
import com.ems.employee_management_system.models.Department;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.Project;
import com.ems.employee_management_system.services.DepartmentService;
import com.ems.employee_management_system.services.EmployeeService;
import com.ems.employee_management_system.services.ProjectService;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    private final ProjectService projectService;
    private final DepartmentService departmentService;
    private final EmployeeService employeeService;

    public ProjectController(ProjectService projectService, DepartmentService departmentService, EmployeeService employeeService) {
        this.projectService = projectService;
        this.departmentService = departmentService;
        this.employeeService = employeeService;
    }

    @GetMapping
    public List<ProjectDTO> getAll() {
        return projectService.getAll().stream()
                .map(ProjectMapper::toDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ProjectDTO getById(@PathVariable UUID id) {
        Project project = projectService.getById(id);
        return project != null ? ProjectMapper.toDTO(project) : null;
    }

    @PostMapping
    public ProjectDTO create(@RequestBody ProjectDTO dto) {
        Department department = departmentService.getById(dto.getDepartmentId());
        Employee manager = dto.getProjectManagerId() != null ? employeeService.getById(dto.getProjectManagerId()) : null;
        Project project = ProjectMapper.toEntity(dto, department, manager);
        return ProjectMapper.toDTO(projectService.save(project));
    }

    @PutMapping("/{id}")
    public ProjectDTO update(@PathVariable UUID id, @RequestBody ProjectDTO dto) {
        Department department = departmentService.getById(dto.getDepartmentId());
        Employee manager = dto.getProjectManagerId() != null ? employeeService.getById(dto.getProjectManagerId()) : null;
        Project project = ProjectMapper.toEntity(dto, department, manager);
        project.setId(id);
        return ProjectMapper.toDTO(projectService.save(project));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        projectService.delete(id);
    }
} 