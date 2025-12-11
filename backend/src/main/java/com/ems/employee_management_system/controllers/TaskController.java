package com.ems.employee_management_system.controllers;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RestController;

import com.ems.employee_management_system.dtos.PaginatedResponseDTO;
import com.ems.employee_management_system.dtos.TaskRequestDTO;
import com.ems.employee_management_system.dtos.TaskResponseDTO;
import com.ems.employee_management_system.mappers.TaskMapper;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.Project;
import com.ems.employee_management_system.models.Task;
import com.ems.employee_management_system.security.SecurityService;
import com.ems.employee_management_system.services.EmployeeService;
import com.ems.employee_management_system.services.ProjectService;
import com.ems.employee_management_system.services.TaskService;
import com.ems.employee_management_system.utils.PaginationUtils;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tasks")
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE')")
public class TaskController {
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(TaskController.class);
    
    private final TaskService taskService;
    private final ProjectService projectService;
    private final EmployeeService employeeService;
    private final SecurityService securityService;

    public TaskController(TaskService taskService, ProjectService projectService, 
                         EmployeeService employeeService, SecurityService securityService) {
        this.taskService = taskService;
        this.projectService = projectService;
        this.employeeService = employeeService;
        this.securityService = securityService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE')")
    public ResponseEntity<PaginatedResponseDTO<TaskResponseDTO>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "ASC") String sortDir) {
        logger.debug("Fetching tasks with pagination: page={}, size={}, sortBy={}, sortDir={}", page, size, sortBy, sortDir);
        
        Pageable pageable = PaginationUtils.createPageable(page, size, sortBy, sortDir);
        Page<Task> taskPage = taskService.getAll(pageable);
        
        return ResponseEntity.ok(PaginationUtils.toPaginatedResponse(taskPage, TaskMapper::toResponseDTO));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER') or " +
                  "(hasRole('EMPLOYEE') and @securityService.isTaskAssignedToUser(#id))")
    public ResponseEntity<TaskResponseDTO> getById(@PathVariable UUID id) {
        logger.debug("Fetching task with id: {}", id);
        Task task = taskService.getById(id);
        if (task == null) {
            logger.warn("Task not found with id: {}", id);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(TaskMapper.toResponseDTO(task));
    }

    @PostMapping
    @PreAuthorize("hasRole('SYSTEM_ADMIN') or " +
                  "(hasRole('DEPARTMENT_MANAGER') and @securityService.isTaskProjectInOwnDepartment(#requestDTO.projectId))")
    public ResponseEntity<TaskResponseDTO> create(@Valid @RequestBody TaskRequestDTO requestDTO) {
        logger.info("Creating new task: {}", requestDTO.getName());
        // Validate related entities exist
        Project project = projectService.getById(requestDTO.getProjectId());
        if (project == null) {
            throw new IllegalArgumentException("Project not found with id: " + requestDTO.getProjectId());
        }
        
        Employee assignedTo = null;
        if (requestDTO.getAssignedToId() != null) {
            assignedTo = employeeService.getById(requestDTO.getAssignedToId());
            if (assignedTo == null) {
                throw new IllegalArgumentException("Employee not found with id: " + requestDTO.getAssignedToId());
            }
        }
        
        Task task = TaskMapper.toEntity(requestDTO, project, assignedTo);
        Task savedTask = taskService.save(task);
        logger.info("Task created successfully with id: {}", savedTask.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(TaskMapper.toResponseDTO(savedTask));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') or " +
                  "(hasRole('DEPARTMENT_MANAGER') and @securityService.isTaskProjectInOwnDepartmentByTaskId(#id)) or " +
                  "(hasRole('EMPLOYEE') and @securityService.isTaskAssignedToUser(#id))")
    public ResponseEntity<TaskResponseDTO> update(@PathVariable UUID id, @Valid @RequestBody TaskRequestDTO requestDTO) {
        logger.info("Updating task with id: {}", id);
        Task existingTask = taskService.getById(id);
        if (existingTask == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Validate related entities exist
        Project project = projectService.getById(requestDTO.getProjectId());
        if (project == null) {
            throw new IllegalArgumentException("Project not found with id: " + requestDTO.getProjectId());
        }
        
        Employee assignedTo = null;
        if (requestDTO.getAssignedToId() != null) {
            assignedTo = employeeService.getById(requestDTO.getAssignedToId());
            if (assignedTo == null) {
                throw new IllegalArgumentException("Employee not found with id: " + requestDTO.getAssignedToId());
            }
        }
        
        Task updatedTask = TaskMapper.toEntity(requestDTO, project, assignedTo);
        updatedTask.setId(id); // Ensure ID is preserved for update
        Task savedTask = taskService.save(updatedTask);
        logger.info("Task updated successfully with id: {}", id);
        return ResponseEntity.ok(TaskMapper.toResponseDTO(savedTask));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') or " +
                  "(hasRole('DEPARTMENT_MANAGER') and @securityService.isTaskProjectInOwnDepartmentByTaskId(#id))")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        logger.info("Deleting task with id: {}", id);
        Task task = taskService.getById(id);
        if (task == null) {
            logger.warn("Task not found with id: {}", id);
            return ResponseEntity.notFound().build();
        }
        taskService.delete(id);
        logger.info("Task deleted successfully with id: {}", id);
        return ResponseEntity.noContent().build();
    }
} 