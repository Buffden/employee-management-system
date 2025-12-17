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
import com.ems.employee_management_system.models.User;
import com.ems.employee_management_system.repositories.EmployeeProjectRepository;
import com.ems.employee_management_system.repositories.EmployeeRepository;
import com.ems.employee_management_system.repositories.InviteTokenRepository;
import com.ems.employee_management_system.repositories.PasswordResetTokenRepository;
import com.ems.employee_management_system.repositories.UserRepository;
import com.ems.employee_management_system.security.SecurityService;

@Service
public class EmployeeService {
    private static final Logger logger = LoggerFactory.getLogger(EmployeeService.class);
    
    private final EmployeeRepository employeeRepository;
    private final EmployeeProjectRepository employeeProjectRepository;
    private final UserRepository userRepository;
    private final InviteTokenRepository inviteTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final SecurityService securityService;

    public EmployeeService(EmployeeRepository employeeRepository,
                           EmployeeProjectRepository employeeProjectRepository,
                           UserRepository userRepository,
                           InviteTokenRepository inviteTokenRepository,
                           PasswordResetTokenRepository passwordResetTokenRepository,
                           SecurityService securityService) {
        this.employeeRepository = employeeRepository;
        this.employeeProjectRepository = employeeProjectRepository;
        this.userRepository = userRepository;
        this.inviteTokenRepository = inviteTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
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
            // For SYSTEM_ADMIN, HR_MANAGER, and EMPLOYEE, use findAllWithRelationships to eagerly load relationships
            // This ensures department, location, and manager are available for mapping to DTOs
            // Employees can view all employees (view-only access, edit/delete still restricted)
            if ("SYSTEM_ADMIN".equals(role) || "HR_MANAGER".equals(role) || "EMPLOYEE".equals(role)) {
                logger.debug("Using findAllWithRelationships() for {} role", role);
                return employeeRepository.findAllWithRelationships(pageable);
            }
            
            // For other roles, use role-based filtering with relationships
            return employeeRepository.findAllFilteredByRole(role, departmentId, userId, pageable);
        } catch (Exception e) {
            logger.error("Error fetching employees with role-based filtering: {}", e.getMessage(), e);
            logger.error("Stack trace: ", e);
            // Fallback to findAllWithRelationships if role-based query fails (for debugging)
            logger.warn("Falling back to findAllWithRelationships() due to error");
            try {
                return employeeRepository.findAllWithRelationships(pageable);
            } catch (Exception fallbackError) {
                logger.error("Fallback findAllWithRelationships() also failed: {}", fallbackError.getMessage(), fallbackError);
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
        return employeeRepository.findByIdWithRelationships(id).orElse(null);
    }

    /**
     * Get employees by department ID (for manager dropdown filtering)
     */
    public List<Employee> getEmployeesByDepartment(UUID departmentId) {
        logger.debug("Fetching employees by department: {}", departmentId);
        return employeeRepository.findByDepartmentId(departmentId);
    }

    /**
     * Search employees for typeahead/autocomplete functionality
     * Searches by name or email, optionally filtered by department
     * Excludes a specific employee (e.g., current employee in edit mode)
     */
    public List<Employee> searchEmployees(String searchTerm, UUID departmentId, UUID excludeEmployeeId) {
        logger.debug("Searching employees - term: {}, departmentId: {}, excludeId: {}", searchTerm, departmentId, excludeEmployeeId);
        String trimmedTerm = (searchTerm != null) ? searchTerm.trim() : "";
        return employeeRepository.searchEmployees(
            trimmedTerm.isEmpty() ? null : trimmedTerm,
            departmentId,
            excludeEmployeeId
        );
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
     * Validates that employee has no active project assignments and no direct reports.
     * Also deletes associated user account if one exists (cascade delete).
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
        
        // Delete associated user account if one exists (cascade delete)
        // Must delete invite tokens and password reset tokens first
        userRepository.findByEmployeeId(id).ifPresent(user -> {
            logger.info("Deleting associated user account for employee {} (user: {})", employee.getEmail(), user.getUsername());
            
            // Delete invite tokens first
            inviteTokenRepository.deleteByUser(user);
            logger.debug("Deleted invite tokens for user {}", user.getUsername());
            
            // Delete password reset tokens
            passwordResetTokenRepository.deleteByUser(user);
            logger.debug("Deleted password reset tokens for user {}", user.getUsername());
            
            // Finally delete the user
            userRepository.delete(user);
            logger.info("Deleted user account for employee {}", employee.getEmail());
        });
        
        employeeRepository.deleteById(id);
        logger.info("Employee deleted successfully with id: {}", id);
    }
} 