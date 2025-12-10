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

import com.ems.employee_management_system.dtos.EmployeeProjectDTO;
import com.ems.employee_management_system.mappers.EmployeeProjectMapper;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.EmployeeProject;
import com.ems.employee_management_system.models.EmployeeProject.EmployeeProjectId;
import com.ems.employee_management_system.models.Project;
import com.ems.employee_management_system.services.EmployeeProjectService;
import com.ems.employee_management_system.services.EmployeeService;
import com.ems.employee_management_system.services.ProjectService;

@RestController
@RequestMapping("/api/employee-projects")
public class EmployeeProjectController {
    private final EmployeeProjectService employeeProjectService;
    private final EmployeeService employeeService;
    private final ProjectService projectService;

    public EmployeeProjectController(EmployeeProjectService employeeProjectService, EmployeeService employeeService, ProjectService projectService) {
        this.employeeProjectService = employeeProjectService;
        this.employeeService = employeeService;
        this.projectService = projectService;
    }

    @GetMapping
    public List<EmployeeProjectDTO> getAll() {
        return employeeProjectService.getAll().stream()
                .map(EmployeeProjectMapper::toDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/{employeeId}/{projectId}")
    public EmployeeProjectDTO getById(@PathVariable("employeeId") String employeeId, @PathVariable("projectId") String projectId) {
        EmployeeProjectId id = new EmployeeProjectId(UUID.fromString(employeeId), UUID.fromString(projectId));
        EmployeeProject ep = employeeProjectService.getById(id);
        return ep != null ? EmployeeProjectMapper.toDTO(ep) : null;
    }

    @PostMapping
    public EmployeeProjectDTO create(@RequestBody EmployeeProjectDTO dto) {
        Employee employee = employeeService.getById(dto.getEmployeeId());
        Project project = projectService.getById(dto.getProjectId());
        EmployeeProject ep = EmployeeProjectMapper.toEntity(dto, employee, project);
        return EmployeeProjectMapper.toDTO(employeeProjectService.save(ep));
    }

    @PutMapping("/{employeeId}/{projectId}")
    public EmployeeProjectDTO update(@PathVariable("employeeId") String employeeId, @PathVariable("projectId") String projectId, @RequestBody EmployeeProjectDTO dto) {
        Employee employee = employeeService.getById(dto.getEmployeeId());
        Project project = projectService.getById(dto.getProjectId());
        EmployeeProject ep = EmployeeProjectMapper.toEntity(dto, employee, project);
        return EmployeeProjectMapper.toDTO(employeeProjectService.save(ep));
    }

    @DeleteMapping("/{employeeId}/{projectId}")
    public void delete(@PathVariable("employeeId") String employeeId, @PathVariable("projectId") String projectId) {
        EmployeeProjectId id = new EmployeeProjectId(UUID.fromString(employeeId), UUID.fromString(projectId));
        employeeProjectService.delete(id);
    }
} 