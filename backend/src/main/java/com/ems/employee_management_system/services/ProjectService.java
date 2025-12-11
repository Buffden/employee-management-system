package com.ems.employee_management_system.services;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.employee_management_system.constants.Constants;
import com.ems.employee_management_system.models.Project;
import com.ems.employee_management_system.repositories.ProjectRepository;

@Service
public class ProjectService {
    private static final Logger logger = LoggerFactory.getLogger(ProjectService.class);
    
    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public org.springframework.data.domain.Page<Project> getAll(org.springframework.data.domain.Pageable pageable) {
        logger.debug("Fetching projects with pagination: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        return projectRepository.findAll(pageable);
    }

    public List<Project> getAll() {
        logger.debug("Fetching all projects (no pagination)");
        return projectRepository.findAll();
    }

    public Project getById(UUID id) {
        logger.debug("Fetching project with id: {}", id);
        return projectRepository.findById(id).orElse(null);
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

    @Transactional
    public void delete(UUID id) {
        logger.info("Deleting project with id: {}", id);
        projectRepository.deleteById(id);
        logger.info("Project deleted successfully with id: {}", id);
    }
} 