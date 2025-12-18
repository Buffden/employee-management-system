package com.ems.employee_management_system.services;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.employee_management_system.constants.Constants;
import com.ems.employee_management_system.models.Project;
import com.ems.employee_management_system.repositories.EmployeeProjectRepository;
import com.ems.employee_management_system.repositories.ProjectRepository;
import com.ems.employee_management_system.repositories.TaskRepository;
import com.ems.employee_management_system.security.SecurityService;

@Service
public class ProjectService {
    private static final Logger logger = LoggerFactory.getLogger(ProjectService.class);
    
    private final ProjectRepository projectRepository;
    private final SecurityService securityService;
    private final EmployeeProjectRepository employeeProjectRepository;
    private final TaskRepository taskRepository;

    public ProjectService(ProjectRepository projectRepository,
                          SecurityService securityService,
                          EmployeeProjectRepository employeeProjectRepository,
                          TaskRepository taskRepository) {
        this.projectRepository = projectRepository;
        this.securityService = securityService;
        this.employeeProjectRepository = employeeProjectRepository;
        this.taskRepository = taskRepository;
    }

    public Page<Project> getAll(Pageable pageable) {
        logger.debug("Fetching projects with pagination: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        String role = securityService.getCurrentUserRole();
        UUID departmentId = securityService.getCurrentUserDepartmentId();
        UUID userId = securityService.getCurrentUserEmployeeId();
        
        logger.debug("Role-based filtering - role: {}, departmentId: {}, userId: {}", role, departmentId, userId);
        
        // If role is null, default to empty result (should not happen due to @PreAuthorize, but defensive coding)
        if (role == null) {
            logger.warn("User role is null, returning empty page");
            return org.springframework.data.domain.Page.empty(pageable);
        }
        
        // For SYSTEM_ADMIN, HR_MANAGER, and EMPLOYEE, use findAllWithRelationships to eagerly load relationships
        // This ensures department and projectManager are available for mapping to DTOs
        // Employees can view all projects (view-only access, edit/delete still restricted)
        if ("SYSTEM_ADMIN".equals(role) || "HR_MANAGER".equals(role) || "EMPLOYEE".equals(role)) {
            logger.debug("Using findAllWithRelationships() for {} role", role);
            return projectRepository.findAllWithRelationships(pageable);
        }
        
        // For other roles (e.g., DEPARTMENT_MANAGER), use role-based filtering with relationships
        Page<Project> result = projectRepository.findAllFilteredByRole(role, departmentId, userId, pageable);
        logger.debug("Found {} projects for role: {}", result.getTotalElements(), role);
        return result;
    }

    public List<Project> getAll() {
        logger.debug("Fetching all projects (no pagination)");
        return projectRepository.findAll();
    }

    public Project getById(UUID id) {
        logger.debug("Fetching project with id: {}", id);
        return projectRepository.findByIdWithRelationships(id).orElse(null);
    }

    /**
     * Saves a project with business logic validation
     * Validates project name uniqueness
     * Validates date constraints (endDate >= startDate)
     * Validates status transitions
     */
    @Transactional
    public Project save(Project project) {
        logger.debug("Saving project: {}", project.getName());
        
        // Validate name uniqueness (excluding current project if updating)
        if (project.getName() != null) {
            projectRepository.findByName(project.getName())
                .ifPresent(existing -> {
                    // Allow update of same project, but prevent duplicate names for different projects
                    if (project.getId() == null || !existing.getId().equals(project.getId())) {
                        logger.warn("Project name already exists: {}", project.getName());
                        throw new IllegalArgumentException("Project with name '" + project.getName() + "' already exists");
                    }
                });
        }
        
        // Validate date constraints
        if (project.getStartDate() != null && project.getEndDate() != null) {
            if (project.getEndDate().isBefore(project.getStartDate())) {
                logger.warn("Invalid date range for project: {}", project.getName());
                throw new IllegalArgumentException("Project end date must be >= start date");
            }
        }
        
        // Validate status (basic validation - status transitions would need more complex logic)
        if (project.getStatus() != null) {
            String status = project.getStatus();
            List<String> validStatuses = Arrays.asList(Constants.VALID_PROJECT_STATUSES);
            if (!validStatuses.contains(status)) {
                logger.warn("Invalid project status: {} for project: {}", status, project.getName());
                throw new IllegalArgumentException("Invalid project status: " + status + ". Valid statuses: " + validStatuses);
            }
        }
        
        Project saved = projectRepository.save(project);
        logger.info("Project saved successfully with id: {}", saved.getId());
        return saved;
    }

    /**
     * Deletes a project with cascade delete of related records
     * Automatically deletes:
     * 1. All employee-project assignments (employee_project records)
     * 2. All tasks associated with the project
     * 3. The project itself
     * 
     * Business rule: Tasks and employee assignments are automatically deleted
     * when a project is deleted, regardless of their state or assignments.
     */
    @Transactional
    public void delete(UUID id) {
        logger.info("Deleting project with id: {}", id);
        
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> {
                logger.warn("Project not found with id: {}", id);
                return new IllegalArgumentException("Project not found with id: " + id);
            });
        
        String projectName = project.getName();
        
        // Count related records for logging
        Long employeeAssignmentCount = employeeProjectRepository.countByProjectId(id);
        Long taskCount = taskRepository.countByProjectId(id);
        
        logger.debug("Project '{}' has {} employee assignment(s) and {} task(s) to be deleted", 
            projectName, employeeAssignmentCount, taskCount);
        
        // Step 1: Delete all employee-project assignments (cascade delete)
        if (employeeAssignmentCount > 0) {
            employeeProjectRepository.deleteByProjectId(id);
            logger.debug("Deleted {} employee-project assignment(s) for project '{}'", 
                employeeAssignmentCount, projectName);
        }
        
        // Step 2: Delete all tasks associated with the project (cascade delete)
        if (taskCount > 0) {
            taskRepository.deleteByProjectId(id);
            logger.debug("Deleted {} task(s) for project '{}'", taskCount, projectName);
        }
        
        // Step 3: Delete the project itself
        projectRepository.deleteById(id);
        logger.info("Project '{}' deleted successfully along with {} employee assignment(s) and {} task(s)", 
            projectName, employeeAssignmentCount, taskCount);
    }
} 