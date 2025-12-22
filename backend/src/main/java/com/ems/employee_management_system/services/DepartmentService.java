package com.ems.employee_management_system.services;

import java.util.List;
import java.util.UUID;

import com.ems.employee_management_system.models.Employee;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.employee_management_system.models.Department;
import com.ems.employee_management_system.repositories.DepartmentRepository;
import com.ems.employee_management_system.repositories.UserRepository;
import com.ems.employee_management_system.security.SecurityService;
import com.ems.employee_management_system.constants.RoleConstants;

@Service
public class DepartmentService {
    private static final Logger logger = LoggerFactory.getLogger(DepartmentService.class);
    
    private final DepartmentRepository departmentRepository;
    private final SecurityService securityService;
    private final EmployeeService employeeService;
    private final UserRepository userRepository;

    public DepartmentService(DepartmentRepository departmentRepository,
                             SecurityService securityService,
                             EmployeeService employeeService,
                             UserRepository userRepository) {
        this.departmentRepository = departmentRepository;
        this.securityService = securityService;
        this.employeeService = employeeService;
        this.userRepository = userRepository;
    }

    public Page<Department> getAll(Pageable pageable) {
        logger.debug("Fetching departments with pagination: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        String role = securityService.getCurrentUserRole();
        UUID departmentId = securityService.getCurrentUserDepartmentId();
        
        // For SYSTEM_ADMIN, HR_MANAGER, and EMPLOYEE, use findAllWithRelationships to eagerly load relationships
        // This ensures location and departmentHead are available for mapping to DTOs
        // Employees can view all departments (view-only access, edit/delete still restricted)
        if ("SYSTEM_ADMIN".equals(role) || "HR_MANAGER".equals(role) || "EMPLOYEE".equals(role)) {
            logger.debug("Using findAllWithRelationships() for {} role", role);
            return departmentRepository.findAllWithRelationships(pageable);
        }
        
        // For other roles (e.g., DEPARTMENT_MANAGER), use role-based filtering with relationships
        return departmentRepository.findAllFilteredByRole(role, departmentId, pageable);
    }

    public List<Department> getAll() {
        logger.debug("Fetching all departments (no pagination)");
        return departmentRepository.findAll();
    }

    public Department getById(UUID id) {
        logger.debug("Fetching department with id: {}", id);
        return departmentRepository.findByIdWithRelationships(id).orElse(null);
    }

    /**
     * Saves a department with business logic validation
     * Validates department name uniqueness
     * Synchronizes bidirectional relationship: ensures department manager employee's department_id matches
     * For DEPARTMENT_MANAGER role, restricts HR-related fields (budget, budgetUtilization, performanceMetric, departmentHeadId)
     */
    @Transactional
    public Department save(Department department) {
        logger.debug("Saving department: {}", department.getName());
        
        // If user is DEPARTMENT_MANAGER, preserve HR-related fields from existing department
        String role = securityService.getCurrentUserRole();
        if ("DEPARTMENT_MANAGER".equals(role) && department.getId() != null) {
            Department existingDepartment = departmentRepository.findById(department.getId()).orElse(null);
            if (existingDepartment != null) {
                // Preserve HR-related fields that DEPARTMENT_MANAGER cannot modify
                department.setBudget(existingDepartment.getBudget());
                department.setBudgetUtilization(existingDepartment.getBudgetUtilization());
                department.setPerformanceMetric(existingDepartment.getPerformanceMetric());
                department.setHead(existingDepartment.getHead()); // Preserve department manager
                logger.debug("Preserved HR-related fields for DEPARTMENT_MANAGER update");
            }
        }
        
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
        
        // Handle department manager synchronization (bidirectional relationship)
        // Business rule: Department manager employee must belong to the department they manage
        // Edge cases handled:
        // 1. Employee can only be head of ONE department at a time
        // 2. When assigning new head, update their department_id to this department
        // 3. When removing/changing head, old head keeps their department_id (they still work there)
        // 4. Validate employee exists and is not already head of another department
        
        Employee newHead = department.getHead();
        Employee oldHead = null;
        
        // Track if this is an update (not a new department)
        boolean isUpdate = department.getId() != null;
        if (isUpdate) {
            Department existingDepartment = departmentRepository.findById(department.getId())
                .orElse(null);
            if (existingDepartment != null) {
                oldHead = existingDepartment.getHead();
            }
        }
        
        // Validate new head assignment
        if (newHead != null) {
            // Edge Case 1: Validate employee is not already manager of a DIFFERENT department
            List<Department> departmentsWhereHead = departmentRepository.findDepartmentsByHeadId(newHead.getId());
            for (Department dept : departmentsWhereHead) {
                // Allow if it's the same department (updating other fields), but prevent if different
                if (department.getId() == null || !dept.getId().equals(department.getId())) {
                    logger.warn("Employee {} is already manager of department {}", 
                        newHead.getId(), dept.getName());
                    throw new IllegalStateException(
                        "Employee is already manager of department: " + dept.getName() + 
                        ". An employee can only be manager of one department at a time.");
                }
            }
            
            // Edge Case 2: Validate employee exists and is managed entity
            // (Already validated in controller, but defensive check)
            if (newHead.getId() == null) {
                throw new IllegalArgumentException("Department manager employee must have an ID");
            }
            
            // Edge Case 3: If employee has direct reports, changing their department might affect them
            // Note: This is handled in EmployeeService.save() validation (manager in same department)
            // So we'll update the employee's department, and if they have reports in a different 
            // department, the EmployeeService will catch it
        }
        
        // Save department first to ensure it has an ID
        Department saved = departmentRepository.save(department);
        
        // Edge Case 4: Synchronize new manager's department_id and update User role
        // Business rule: Department manager must belong to the department they manage
        // Also update the User's role to DEPARTMENT_MANAGER if they have a User account
        if (newHead != null) {
            // Only update if employee's department doesn't already match
            boolean needsUpdate = newHead.getDepartment() == null || 
                                  !saved.getId().equals(newHead.getDepartment().getId());
            
            if (needsUpdate) {
                logger.debug("Updating department manager employee {} to belong to department {}", 
                    newHead.getId(), saved.getId());
                
                // Get fresh employee entity to ensure we're working with managed entity
                Employee employeeToUpdate = employeeService.getById(newHead.getId());
                if (employeeToUpdate == null) {
                    throw new IllegalArgumentException("Department manager employee not found: " + newHead.getId());
                }
                
                // Update employee's department to match this department
                employeeToUpdate.setDepartment(saved);
                
                // This will also validate manager is in same department
                employeeService.save(employeeToUpdate);
                logger.info("Synchronized department manager employee's department assignment");
            } else {
                logger.debug("Department manager employee {} already belongs to department {}, no update needed", 
                    newHead.getId(), saved.getId());
            }
            
            // Update User role to DEPARTMENT_MANAGER if user account exists
            userRepository.findByEmployeeId(newHead.getId()).ifPresent(user -> {
                if (!RoleConstants.DEPARTMENT_MANAGER.equals(user.getRole())) {
                    logger.info("Updating User role to DEPARTMENT_MANAGER for employee {} (user: {})", 
                        newHead.getId(), user.getUsername());
                    user.setRole(RoleConstants.DEPARTMENT_MANAGER);
                    userRepository.save(user);
                    logger.info("User role updated successfully");
                } else {
                    logger.debug("User {} already has DEPARTMENT_MANAGER role", user.getUsername());
                }
            });
        }
        
        // Edge Case 5: When removing department manager (newHead is null but oldHead existed)
        // The old manager's department_id is NOT changed - they may still work in that department
        // Only the department.department_head_id is set to NULL
        // Note: We do NOT automatically change the old manager's User role back to EMPLOYEE
        // as they may still need DEPARTMENT_MANAGER role for other purposes
        if (isUpdate && oldHead != null && newHead == null) {
            logger.debug("Department manager removed. Old manager {} retains their department assignment", 
                oldHead.getId());
        }
        
        // Edge Case 6: When changing department manager (oldHead and newHead both exist and are different)
        // Old manager keeps their department_id (they still work there, just not as manager)
        // New manager gets their department_id updated to this department
        if (isUpdate && oldHead != null && newHead != null && !oldHead.getId().equals(newHead.getId())) {
            logger.debug("Department manager changed from {} to {}. Old manager retains department assignment", 
                oldHead.getId(), newHead.getId());
        }
        
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
    /**
     * Search departments for typeahead/autocomplete functionality
     * Searches by name, optionally filtered by location
     * Excludes a specific department (e.g., current department in edit mode)
     */
    public List<Department> searchDepartments(String searchTerm, UUID locationId, UUID excludeDepartmentId) {
        logger.debug("Searching departments - term: {}, locationId: {}, excludeId: {}", searchTerm, locationId, excludeDepartmentId);
        String trimmedTerm = (searchTerm != null) ? searchTerm.trim() : "";
        return departmentRepository.searchDepartments(
                trimmedTerm.isEmpty() ? null : trimmedTerm,
                locationId,
                excludeDepartmentId
        );
    }
} 