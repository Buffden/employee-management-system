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
import com.ems.employee_management_system.repositories.EmployeeRepository;
import com.ems.employee_management_system.security.SecurityService;

@Service
public class EmployeeService {
    private static final Logger logger = LoggerFactory.getLogger(EmployeeService.class);
    
    private final EmployeeRepository employeeRepository;
    private final SecurityService securityService;

    public EmployeeService(EmployeeRepository employeeRepository,
                           SecurityService securityService) {
        this.employeeRepository = employeeRepository;
        this.securityService = securityService;
    }

    public Page<Employee> getAll(Pageable pageable) {
        logger.debug("Fetching employees with pagination: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        String role = securityService.getCurrentUserRole();
        UUID departmentId = securityService.getCurrentUserDepartmentId();
        UUID userId = securityService.getCurrentUserEmployeeId();
        return employeeRepository.findAllFilteredByRole(role, departmentId, userId, pageable);
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
     * Saves an employee with business logic validation
     * Validates email uniqueness
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
        
        Employee saved = employeeRepository.save(employee);
        logger.info("Employee saved successfully with id: {}", saved.getId());
        return saved;
    }

    @Transactional
    public void delete(UUID id) {
        logger.info("Deleting employee with id: {}", id);
        employeeRepository.deleteById(id);
        logger.info("Employee deleted successfully with id: {}", id);
    }
} 