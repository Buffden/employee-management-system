package com.ems.employee_management_system.services;

import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.employee_management_system.models.Department;
import com.ems.employee_management_system.repositories.DepartmentRepository;
import com.ems.employee_management_system.security.SecurityService;

@Service
public class DepartmentService {
    private static final Logger logger = LoggerFactory.getLogger(DepartmentService.class);
    
    private final DepartmentRepository departmentRepository;
    private final SecurityService securityService;

    public DepartmentService(DepartmentRepository departmentRepository,
                             SecurityService securityService) {
        this.departmentRepository = departmentRepository;
        this.securityService = securityService;
    }

    public Page<Department> getAll(Pageable pageable) {
        logger.debug("Fetching departments with pagination: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        String role = securityService.getCurrentUserRole();
        UUID departmentId = securityService.getCurrentUserDepartmentId();
        return departmentRepository.findAllFilteredByRole(role, departmentId, pageable);
    }

    public List<Department> getAll() {
        logger.debug("Fetching all departments (no pagination)");
        return departmentRepository.findAll();
    }

    public Department getById(UUID id) {
        logger.debug("Fetching department with id: {}", id);
        return departmentRepository.findById(id).orElse(null);
    }

    /**
     * Saves a department with business logic validation
     * Validates department name uniqueness
     */
    @Transactional
    public Department save(Department department) {
        logger.debug("Saving department: {}", department.getName());
        
        // Validate name uniqueness (excluding current department if updating)
        if (department.getName() != null) {
            departmentRepository.findByName(department.getName())
                .ifPresent(existing -> {
                    // Allow update of same department, but prevent duplicate names for different departments
                    if (department.getId() == null || !existing.getId().equals(department.getId())) {
                        logger.warn("Department name already exists: {}", department.getName());
                        throw new IllegalArgumentException("Department with name '" + department.getName() + "' already exists");
                    }
                });
        }
        
        Department saved = departmentRepository.save(department);
        logger.info("Department saved successfully with id: {}", saved.getId());
        return saved;
    }

    /**
     * Deletes a department with business logic validation
     * Validates that department has no employees before deletion
     */
    @Transactional
    public void delete(UUID id) {
        logger.info("Deleting department with id: {}", id);
        
        Department department = departmentRepository.findById(id)
            .orElseThrow(() -> {
                logger.warn("Department not found with id: {}", id);
                return new IllegalArgumentException("Department not found with id: " + id);
            });
        
        // Validate no employees in department
        Long employeeCount = departmentRepository.countEmployeesByDepartment(id);
        if (employeeCount > 0) {
            logger.warn("Cannot delete department {}: {} employees assigned", department.getName(), employeeCount);
            throw new IllegalStateException("Cannot delete department with " + employeeCount + " employee(s). Please reassign employees first.");
        }
        
        departmentRepository.deleteById(id);
        logger.info("Department deleted successfully with id: {}", id);
    }
} 