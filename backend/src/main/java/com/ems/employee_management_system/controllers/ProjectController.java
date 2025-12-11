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
import org.springframework.web.bind.annotation.RestController;

import com.ems.employee_management_system.dtos.PaginatedResponseDTO;
import com.ems.employee_management_system.dtos.ProjectRequestDTO;
import com.ems.employee_management_system.dtos.ProjectResponseDTO;
import com.ems.employee_management_system.mappers.ProjectMapper;
import com.ems.employee_management_system.models.Department;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.Project;
import com.ems.employee_management_system.services.DepartmentService;
import com.ems.employee_management_system.services.EmployeeService;
import com.ems.employee_management_system.services.ProjectService;
import com.ems.employee_management_system.utils.PaginationUtils;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(ProjectController.class);
    
    private final ProjectService projectService;
    private final DepartmentService departmentService;
    private final EmployeeService employeeService;

    public ProjectController(ProjectService projectService, DepartmentService departmentService, EmployeeService employeeService) {
        this.projectService = projectService;
        this.departmentService = departmentService;
        this.employeeService = employeeService;
    }

    @GetMapping
    public ResponseEntity<PaginatedResponseDTO<ProjectResponseDTO>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "ASC") String sortDir) {
        logger.debug("Fetching projects with pagination: page={}, size={}, sortBy={}, sortDir={}", page, size, sortBy, sortDir);
        
        Pageable pageable = PaginationUtils.createPageable(page, size, sortBy, sortDir);
        Page<Project> projectPage = projectService.getAll(pageable);
        
        return ResponseEntity.ok(PaginationUtils.toPaginatedResponse(projectPage, ProjectMapper::toResponseDTO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponseDTO> getById(@PathVariable UUID id) {
        logger.debug("Fetching project with id: {}", id);
        Project project = projectService.getById(id);
        if (project == null) {
            logger.warn("Project not found with id: {}", id);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ProjectMapper.toResponseDTO(project));
    }

    @PostMapping
    public ResponseEntity<ProjectResponseDTO> create(@Valid @RequestBody ProjectRequestDTO requestDTO) {
        logger.info("Creating new project: {}", requestDTO.getName());
        // Validate related entities exist
        Department department = departmentService.getById(requestDTO.getDepartmentId());
        if (department == null) {
            throw new IllegalArgumentException("Department not found with id: " + requestDTO.getDepartmentId());
        }
        
        Employee manager = null;
        if (requestDTO.getProjectManagerId() != null) {
            manager = employeeService.getById(requestDTO.getProjectManagerId());
            if (manager == null) {
                throw new IllegalArgumentException("Project manager not found with id: " + requestDTO.getProjectManagerId());
            }
        }
        
        Project project = ProjectMapper.toEntity(requestDTO, department, manager);
        Project savedProject = projectService.save(project);
        logger.info("Project created successfully with id: {}", savedProject.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ProjectMapper.toResponseDTO(savedProject));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponseDTO> update(@PathVariable UUID id, @Valid @RequestBody ProjectRequestDTO requestDTO) {
        logger.info("Updating project with id: {}", id);
        Project existingProject = projectService.getById(id);
        if (existingProject == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Validate related entities exist
        Department department = departmentService.getById(requestDTO.getDepartmentId());
        if (department == null) {
            throw new IllegalArgumentException("Department not found with id: " + requestDTO.getDepartmentId());
        }
        
        Employee manager = null;
        if (requestDTO.getProjectManagerId() != null) {
            manager = employeeService.getById(requestDTO.getProjectManagerId());
            if (manager == null) {
                throw new IllegalArgumentException("Project manager not found with id: " + requestDTO.getProjectManagerId());
            }
        }
        
        Project updatedProject = ProjectMapper.toEntity(requestDTO, department, manager);
        updatedProject.setId(id); // Ensure ID is preserved for update
        Project savedProject = projectService.save(updatedProject);
        logger.info("Project updated successfully with id: {}", id);
        return ResponseEntity.ok(ProjectMapper.toResponseDTO(savedProject));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        logger.info("Deleting project with id: {}", id);
        Project project = projectService.getById(id);
        if (project == null) {
            logger.warn("Project not found with id: {}", id);
            return ResponseEntity.notFound().build();
        }
        projectService.delete(id);
        logger.info("Project deleted successfully with id: {}", id);
        return ResponseEntity.noContent().build();
    }
} 