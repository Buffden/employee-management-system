package com.ems.employee_management_system.services;

import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.employee_management_system.models.EmployeeProject;
import com.ems.employee_management_system.models.EmployeeProject.EmployeeProjectId;
import com.ems.employee_management_system.repositories.EmployeeProjectRepository;
import com.ems.employee_management_system.security.SecurityService;

@Service
public class EmployeeProjectService {
    private static final Logger logger = LoggerFactory.getLogger(EmployeeProjectService.class);
    
    private final EmployeeProjectRepository employeeProjectRepository;
    private final SecurityService securityService;

    public EmployeeProjectService(EmployeeProjectRepository employeeProjectRepository,
                                  SecurityService securityService) {
        this.employeeProjectRepository = employeeProjectRepository;
        this.securityService = securityService;
    }

    public Page<EmployeeProject> getAll(Pageable pageable) {
        logger.debug("Fetching employee-project assignments with pagination: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        String role = securityService.getCurrentUserRole();
        UUID departmentId = securityService.getCurrentUserDepartmentId();
        UUID userId = securityService.getCurrentUserEmployeeId();
        return employeeProjectRepository.findAllFilteredByRole(role, departmentId, userId, pageable);
    }

    public List<EmployeeProject> getAll() {
        logger.debug("Fetching all employee-project assignments (no pagination)");
        return employeeProjectRepository.findAll();
    }

    public EmployeeProject getById(EmployeeProjectId id) {
        logger.debug("Fetching employee-project assignment: employeeId={}, projectId={}", id.getEmployee(), id.getProject());
        return employeeProjectRepository.findById(id).orElse(null);
    }

    /**
     * Saves an employee-project assignment with business logic validation
     * Composite key uniqueness is enforced by the database, but we validate entity existence
     * Note: Employee and Project existence validation is done in the controller layer
     */
    @Transactional
    public EmployeeProject save(EmployeeProject employeeProject) {
        logger.debug("Saving employee-project assignment: employeeId={}, projectId={}", 
                employeeProject.getEmployee() != null ? employeeProject.getEmployee().getId() : null,
                employeeProject.getProject() != null ? employeeProject.getProject().getId() : null);
        
        // Composite key uniqueness is enforced by database constraint
        // Employee and Project existence is validated in controller before calling this method
        EmployeeProject saved = employeeProjectRepository.save(employeeProject);
        logger.info("Employee-project assignment saved successfully");
        return saved;
    }

    @Transactional
    public void delete(EmployeeProjectId id) {
        logger.info("Deleting employee-project assignment: employeeId={}, projectId={}", id.getEmployee(), id.getProject());
        employeeProjectRepository.deleteById(id);
        logger.info("Employee-project assignment deleted successfully");
    }
} 