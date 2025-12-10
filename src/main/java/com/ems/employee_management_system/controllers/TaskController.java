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

import com.ems.employee_management_system.dtos.TaskDTO;
import com.ems.employee_management_system.mappers.TaskMapper;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.Project;
import com.ems.employee_management_system.models.Task;
import com.ems.employee_management_system.services.EmployeeService;
import com.ems.employee_management_system.services.ProjectService;
import com.ems.employee_management_system.services.TaskService;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskService taskService;
    private final ProjectService projectService;
    private final EmployeeService employeeService;

    public TaskController(TaskService taskService, ProjectService projectService, EmployeeService employeeService) {
        this.taskService = taskService;
        this.projectService = projectService;
        this.employeeService = employeeService;
    }

    @GetMapping
    public List<TaskDTO> getAll() {
        return taskService.getAll().stream()
                .map(TaskMapper::toDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public TaskDTO getById(@PathVariable UUID id) {
        Task task = taskService.getById(id);
        return task != null ? TaskMapper.toDTO(task) : null;
    }

    @PostMapping
    public TaskDTO create(@RequestBody TaskDTO dto) {
        Project project = projectService.getById(dto.getProjectId());
        Employee assignedTo = dto.getAssignedToId() != null ? employeeService.getById(dto.getAssignedToId()) : null;
        Task task = TaskMapper.toEntity(dto, project, assignedTo);
        return TaskMapper.toDTO(taskService.save(task));
    }

    @PutMapping("/{id}")
    public TaskDTO update(@PathVariable UUID id, @RequestBody TaskDTO dto) {
        Project project = projectService.getById(dto.getProjectId());
        Employee assignedTo = dto.getAssignedToId() != null ? employeeService.getById(dto.getAssignedToId()) : null;
        Task task = TaskMapper.toEntity(dto, project, assignedTo);
        task.setId(id);
        return TaskMapper.toDTO(taskService.save(task));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        taskService.delete(id);
    }
} 