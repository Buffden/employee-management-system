package com.ems.employee_management_system.services;

import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.repositories.EmployeeProjectRepository;
import com.ems.employee_management_system.repositories.EmployeeRepository;
import com.ems.employee_management_system.security.SecurityService;

@Service
public class EmployeeService {
    private static final Logger logger = LoggerFactory.getLogger(EmployeeService.class);
    
    private final EmployeeRepository employeeRepository;
    private final EmployeeProjectRepository employeeProjectRepository;
    private final SecurityService securityService;

    public EmployeeService(EmployeeRepository employeeRepository,
                           EmployeeProjectRepository employeeProjectRepository,
                           SecurityService securityService) {
        this.employeeRepository = employeeRepository;
        this.employeeProjectRepository = employeeProjectRepository;
        this.securityService = securityService;
    }

    public Page<Employee> getAll(Pageable pageable) {
        logger.debug("Fetching employees with pagination: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        String role = securityService.getCurrentUserRole();
        UUID departmentId = securityService.getCurrentUserDepartmentId();
        UUID userId = securityService.getCurrentUserEmployeeId();
        
        logger.debug("Role-based filtering - role: {}, departmentId: {}, userId: {}", role, departmentId, userId);
        
        // If role is null, default to empty result (should not happen due to @PreAuthorize, but defensive coding)
        if (role == null) {
            logger.warn("User role is null, returning empty page");
            return org.springframework.data.domain.Page.empty(pageable);
        }
        
        try {
            // For SYSTEM_ADMIN and HR_MANAGER, we can use findAll() for simplicity
            // This avoids potential query issues and is more performant
            if ("SYSTEM_ADMIN".equals(role) || "HR_MANAGER".equals(role)) {
                logger.debug("Using findAll() for {} role", role);
                return employeeRepository.findAll(pageable);
            }
            
            // For other roles, use role-based filtering
            return employeeRepository.findAllFilteredByRole(role, departmentId, userId, pageable);
        } catch (Exception e) {
            logger.error("Error fetching employees with role-based filtering: {}", e.getMessage(), e);
            logger.error("Stack trace: ", e);
            // Fallback to findAll() if role-based query fails (for debugging)
            logger.warn("Falling back to findAll() due to error");
            try {
                return employeeRepository.findAll(pageable);
            } catch (Exception fallbackError) {
                logger.error("Fallback findAll() also failed: {}", fallbackError.getMessage(), fallbackError);
                throw new RuntimeException("Failed to fetch employees: " + e.getMessage(), e);
            }
        }
    }

    public List<Employee> getAll() {
        logger.debug("Fetching all employees (no pagination)");
        return employeeRepository.findAll();
    }

    public Employee getById(UUID id) {
        logger.debug("Fetching employee with id: {}", id);
        return employeeRepository.findById(id).orElse(null);
    }

    /**
     * Get employees by department ID (for manager dropdown filtering)
     */
    public List<Employee> getEmployeesByDepartment(UUID departmentId) {
        logger.debug("Fetching employees by department: {}", departmentId);
        return employeeRepository.findByDepartmentId(departmentId);
    }

    /**
     * Saves an employee with business logic validation
     * Validates email uniqueness and manager in same department
     */
    @Transactional
    public Employee save(Employee employee) {
        logger.debug("Saving employee: {}", employee.getEmail());
        
        // Validate email uniqueness (excluding current employee if updating)
        if (employee.getEmail() != null) {
            employeeRepository.findByEmail(employee.getEmail())
                .ifPresent(existing -> {
                    // Allow update of same employee, but prevent duplicate emails for different employees
                    if (employee.getId() == null || !existing.getId().equals(employee.getId())) {
                        logger.warn("Employee email already exists: {}", employee.getEmail());
                        throw new IllegalArgumentException("Employee with email '" + employee.getEmail() + "' already exists");
                    }
                });
        }
        
        // Validate manager is in same department (if manager is assigned)
        if (employee.getManager() != null && employee.getDepartment() != null) {
            Employee manager = employee.getManager();
            if (manager.getDepartment() == null || !manager.getDepartment().getId().equals(employee.getDepartment().getId())) {
                logger.warn("Manager {} is not in the same department as employee {}", manager.getId(), employee.getId());
                throw new IllegalArgumentException("Manager must be in the same department as the employee");
            }
        }
        
        Employee saved = employeeRepository.save(employee);
        logger.info("Employee saved successfully with id: {}", saved.getId());
        return saved;
    }

    /**
     * Deletes an employee with business logic validation
     * Validates that employee has no active project assignments and no direct reports
     */
    @Transactional
    public void delete(UUID id) {
        logger.info("Deleting employee with id: {}", id);
        
        Employee employee = employeeRepository.findById(id)
            .orElseThrow(() -> {
                logger.warn("Employee not found with id: {}", id);
                return new IllegalArgumentException("Employee not found with id: " + id);
            });
        
        // Validate no active project assignments
        Long projectAssignmentCount = employeeProjectRepository.countByEmployeeId(id);
        if (projectAssignmentCount > 0) {
            logger.warn("Cannot delete employee {}: {} project assignment(s) found", employee.getEmail(), projectAssignmentCount);
            throw new IllegalStateException("Cannot delete employee with " + projectAssignmentCount + " project assignment(s). Please remove employee from all projects first.");
        }
        
        // Validate no direct reports
        Long directReportsCount = employeeRepository.countDirectReports(id);
        if (directReportsCount > 0) {
            logger.warn("Cannot delete employee {}: {} direct report(s) found", employee.getEmail(), directReportsCount);
            throw new IllegalStateException("Cannot delete employee with " + directReportsCount + " direct report(s). Please reassign direct reports first.");
        }
        
        employeeRepository.deleteById(id);
        logger.info("Employee deleted successfully with id: {}", id);
    }
} 