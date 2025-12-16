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
import com.ems.employee_management_system.security.SecurityService;

@Service
public class DepartmentService {
    private static final Logger logger = LoggerFactory.getLogger(DepartmentService.class);
    
    private final DepartmentRepository departmentRepository;
    private final SecurityService securityService;
    private final EmployeeService employeeService;

    public DepartmentService(DepartmentRepository departmentRepository,
                             SecurityService securityService,
                             EmployeeService employeeService) {
        this.departmentRepository = departmentRepository;
        this.securityService = securityService;
        this.employeeService = employeeService;
    }

    public Page<Department> getAll(Pageable pageable) {
        logger.debug("Fetching departments with pagination: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        String role = securityService.getCurrentUserRole();
        UUID departmentId = securityService.getCurrentUserDepartmentId();
        
        // For SYSTEM_ADMIN, HR_MANAGER, and EMPLOYEE, we can use findAll() for simplicity
        // This avoids potential query issues and is more performant
        // Employees can view all departments (view-only access, edit/delete still restricted)
        if ("SYSTEM_ADMIN".equals(role) || "HR_MANAGER".equals(role) || "EMPLOYEE".equals(role)) {
            logger.debug("Using findAll() for {} role", role);
            return departmentRepository.findAll(pageable);
        }
        
        // For other roles (e.g., DEPARTMENT_MANAGER), use role-based filtering
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
     * Synchronizes bidirectional relationship: ensures department head employee's department_id matches
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
        
        // Handle department head synchronization (bidirectional relationship)
        // Business rule: Department head employee must belong to the department they head
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
            // Edge Case 1: Validate employee is not already head of a DIFFERENT department
            List<Department> departmentsWhereHead = departmentRepository.findDepartmentsByHeadId(newHead.getId());
            for (Department dept : departmentsWhereHead) {
                // Allow if it's the same department (updating other fields), but prevent if different
                if (department.getId() == null || !dept.getId().equals(department.getId())) {
                    logger.warn("Employee {} is already head of department {}", 
                        newHead.getId(), dept.getName());
                    throw new IllegalStateException(
                        "Employee is already head of department: " + dept.getName() + 
                        ". An employee can only be head of one department at a time.");
                }
            }
            
            // Edge Case 2: Validate employee exists and is managed entity
            // (Already validated in controller, but defensive check)
            if (newHead.getId() == null) {
                throw new IllegalArgumentException("Department head employee must have an ID");
            }
            
            // Edge Case 3: If employee has direct reports, changing their department might affect them
            // Note: This is handled in EmployeeService.save() validation (manager in same department)
            // So we'll update the employee's department, and if they have reports in a different 
            // department, the EmployeeService will catch it
        }
        
        // Save department first to ensure it has an ID
        Department saved = departmentRepository.save(department);
        
        // Edge Case 4: Synchronize new head's department_id
        // Business rule: Department head must belong to the department they head
        if (newHead != null) {
            // Only update if employee's department doesn't already match
            boolean needsUpdate = newHead.getDepartment() == null || 
                                  !saved.getId().equals(newHead.getDepartment().getId());
            
            if (needsUpdate) {
                logger.debug("Updating department head employee {} to belong to department {}", 
                    newHead.getId(), saved.getId());
                
                // Get fresh employee entity to ensure we're working with managed entity
                Employee employeeToUpdate = employeeService.getById(newHead.getId());
                if (employeeToUpdate == null) {
                    throw new IllegalArgumentException("Department head employee not found: " + newHead.getId());
                }
                
                // Update employee's department to match this department
                employeeToUpdate.setDepartment(saved);
                
                // This will also validate manager is in same department
                employeeService.save(employeeToUpdate);
                logger.info("Synchronized department head employee's department assignment");
            } else {
                logger.debug("Department head employee {} already belongs to department {}, no update needed", 
                    newHead.getId(), saved.getId());
            }
        }
        
        // Edge Case 5: When removing department head (newHead is null but oldHead existed)
        // The old head's department_id is NOT changed - they may still work in that department
        // Only the department.department_head_id is set to NULL
        if (isUpdate && oldHead != null && newHead == null) {
            logger.debug("Department head removed. Old head {} retains their department assignment", 
                oldHead.getId());
        }
        
        // Edge Case 6: When changing department head (oldHead and newHead both exist and are different)
        // Old head keeps their department_id (they still work there, just not as head)
        // New head gets their department_id updated to this department
        if (isUpdate && oldHead != null && newHead != null && !oldHead.getId().equals(newHead.getId())) {
            logger.debug("Department head changed from {} to {}. Old head retains department assignment", 
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