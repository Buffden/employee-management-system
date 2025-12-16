package com.ems.employee_management_system.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ems.employee_management_system.dtos.EmployeeQueryRequestDTO;
import com.ems.employee_management_system.dtos.EmployeeRequestDTO;
import com.ems.employee_management_system.dtos.EmployeeResponseDTO;
import com.ems.employee_management_system.dtos.FilterOptionDTO;
import com.ems.employee_management_system.dtos.PaginatedResponseDTO;
import com.ems.employee_management_system.mappers.EmployeeMapper;
import com.ems.employee_management_system.models.Department;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.Location;
import com.ems.employee_management_system.services.DepartmentService;
import com.ems.employee_management_system.services.EmployeeService;
import com.ems.employee_management_system.services.LocationService;
import com.ems.employee_management_system.services.AccountProvisioningService;
import com.ems.employee_management_system.utils.PaginationUtils;
import com.ems.employee_management_system.constants.RoleConstants;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/employees")
@PreAuthorize("hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "','" + RoleConstants.HR_MANAGER + "','" + RoleConstants.DEPARTMENT_MANAGER + "','" + RoleConstants.EMPLOYEE + "')")
public class EmployeeController {
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(EmployeeController.class);
    
    private final EmployeeService employeeService;
    private final DepartmentService departmentService;
    private final LocationService locationService;
    private final AccountProvisioningService accountProvisioningService;

    public EmployeeController(EmployeeService employeeService,
                              DepartmentService departmentService,
                              LocationService locationService,
                              AccountProvisioningService accountProvisioningService) {
        this.employeeService = employeeService;
        this.departmentService = departmentService;
        this.locationService = locationService;
        this.accountProvisioningService = accountProvisioningService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "','" + RoleConstants.HR_MANAGER + "','" + RoleConstants.DEPARTMENT_MANAGER + "','" + RoleConstants.EMPLOYEE + "')")
    public ResponseEntity<PaginatedResponseDTO<EmployeeResponseDTO>> query(@RequestBody EmployeeQueryRequestDTO queryRequest) {
        logger.debug("Querying employees with pagination: page={}, size={}, sortBy={}, sortDir={}", 
                queryRequest.getPage(), queryRequest.getSize(), queryRequest.getSortBy(), queryRequest.getSortDir());
        
        try {
            Pageable pageable = PaginationUtils.createPageable(
                    queryRequest.getPage(), 
                    queryRequest.getSize(), 
                    queryRequest.getSortBy(), 
                    queryRequest.getSortDir());
            Page<Employee> employeePage = employeeService.getAll(pageable);
            
            // Build filters array with departments, locations, and designations for reusable table filtering
            // IMPORTANT: Filters should ALWAYS contain ALL possible values, independent of pagination
            Map<String, List<FilterOptionDTO>> filters = new HashMap<>();
            
            // Get all departments for filter dropdown
            List<Department> allDepartments = departmentService.getAll();
            List<FilterOptionDTO> departmentFilters = allDepartments.stream()
                    .map(dept -> new FilterOptionDTO(
                            dept.getId().toString(),
                            dept.getName()
                    ))
                    .collect(Collectors.toList());
            filters.put("departments", departmentFilters);
            
            // Get all locations for filter dropdown
            List<Location> allLocations = locationService.getAll();
            List<FilterOptionDTO> locationFilters = allLocations.stream()
                    .map(loc -> new FilterOptionDTO(
                            loc.getId().toString(),
                            loc.getName(),
                            loc.getCity() + ", " + loc.getState() // Additional display info
                    ))
                    .collect(Collectors.toList());
            filters.put("locations", locationFilters);
            
            // Get unique designations from all employees (for filter dropdown)
            // Note: This could be optimized by adding a Designation entity in the future
            try {
                List<Employee> allEmployees = employeeService.getAll();
                List<FilterOptionDTO> designationFilters = allEmployees.stream()
                        .map(Employee::getDesignation)
                        .filter(designation -> designation != null && !designation.isEmpty())
                        .distinct()
                        .sorted()
                        .map(designation -> new FilterOptionDTO(designation, designation))
                        .collect(Collectors.toList());
                filters.put("designations", designationFilters);
            } catch (Exception e) {
                logger.warn("Error fetching all employees for designation filter: {}", e.getMessage());
                // If this fails, just use an empty list for designations
                filters.put("designations", new java.util.ArrayList<>());
            }
            
            return ResponseEntity.ok(PaginationUtils.toPaginatedResponse(employeePage, EmployeeMapper::toResponseDTO, filters));
        } catch (Exception e) {
            logger.error("Error querying employees: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to query employees: " + e.getMessage(), e);
        }
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "','" + RoleConstants.HR_MANAGER + "','" + RoleConstants.DEPARTMENT_MANAGER + "','" + RoleConstants.EMPLOYEE + "')")
    public ResponseEntity<List<EmployeeResponseDTO>> search(
            @org.springframework.web.bind.annotation.RequestParam(required = false) String q,
            @org.springframework.web.bind.annotation.RequestParam(required = false) UUID departmentId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) UUID excludeId) {
        logger.debug("Searching employees - term: {}, departmentId: {}, excludeId: {}", q, departmentId, excludeId);
        List<Employee> employees = employeeService.searchEmployees(q, departmentId, excludeId);
        List<EmployeeResponseDTO> response = employees.stream()
                .map(EmployeeMapper::toResponseDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "','" + RoleConstants.HR_MANAGER + "') or " +
                  "(hasRole('" + RoleConstants.DEPARTMENT_MANAGER + "') and @securityService.isInOwnDepartment(#id)) or " +
                  "(hasRole('" + RoleConstants.EMPLOYEE + "') and @securityService.isOwnRecord(#id))")
    public ResponseEntity<EmployeeResponseDTO> getById(@PathVariable UUID id) {
        logger.debug("Fetching employee with id: {}", id);
        Employee employee = employeeService.getById(id);
        if (employee == null) {
            logger.warn("Employee not found with id: {}", id);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(EmployeeMapper.toResponseDTO(employee));
    }

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "','" + RoleConstants.HR_MANAGER + "')")
    public ResponseEntity<EmployeeResponseDTO> create(@Valid @RequestBody EmployeeRequestDTO requestDTO) {
        logger.info("Creating new employee: {}", requestDTO.getEmail());
        // Validate related entities exist
        Department department = departmentService.getById(requestDTO.getDepartmentId());
        if (department == null) {
            throw new IllegalArgumentException("Department not found with id: " + requestDTO.getDepartmentId());
        }
        
        Location location = locationService.getById(requestDTO.getLocationId());
        if (location == null) {
            throw new IllegalArgumentException("Location not found with id: " + requestDTO.getLocationId());
        }
        
        Employee manager = null;
        if (requestDTO.getManagerId() != null) {
            manager = employeeService.getById(requestDTO.getManagerId());
            if (manager == null) {
                throw new IllegalArgumentException("Manager not found with id: " + requestDTO.getManagerId());
            }
            // Validate manager is in same department
            if (manager.getDepartment() == null || !manager.getDepartment().getId().equals(department.getId())) {
                throw new IllegalArgumentException("Manager must be in the same department as the employee");
            }
        }
        
        Employee employee = EmployeeMapper.toEntity(requestDTO, department, location, manager);
        Employee savedEmployee = employeeService.save(employee);
        logger.info("Employee created successfully with id: {}", savedEmployee.getId());

        HttpHeaders headers = new HttpHeaders();
        if (requestDTO.isGrantAccess()) {
            try {
                String inviteToken = accountProvisioningService.provisionUserForEmployee(savedEmployee);
                if (inviteToken != null && !inviteToken.isEmpty()) {
                    headers.add("X-Invite-Token", inviteToken); // Returned for demo mode consumers
                }
            } catch (Exception ex) {
                logger.error("Failed to provision access for employee {}: {}", savedEmployee.getEmail(), ex.getMessage());
                // Do not fail employee creation; optionally expose error
                headers.add("X-Invite-Error", "Failed to provision access");
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .headers(headers)
                .body(EmployeeMapper.toResponseDTO(savedEmployee));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "','" + RoleConstants.HR_MANAGER + "') or " +
                  "(hasRole('" + RoleConstants.DEPARTMENT_MANAGER + "') and @securityService.isInOwnDepartment(#id)) or " +
                  "(hasRole('" + RoleConstants.EMPLOYEE + "') and @securityService.isOwnRecord(#id))")
    public ResponseEntity<EmployeeResponseDTO> update(@PathVariable UUID id, @Valid @RequestBody EmployeeRequestDTO requestDTO) {
        logger.info("Updating employee with id: {}", id);
        Employee existingEmployee = employeeService.getById(id);
        if (existingEmployee == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Validate related entities exist
        Department department = departmentService.getById(requestDTO.getDepartmentId());
        if (department == null) {
            throw new IllegalArgumentException("Department not found with id: " + requestDTO.getDepartmentId());
        }
        
        Location location = locationService.getById(requestDTO.getLocationId());
        if (location == null) {
            throw new IllegalArgumentException("Location not found with id: " + requestDTO.getLocationId());
        }
        
        Employee manager = null;
        if (requestDTO.getManagerId() != null) {
            manager = employeeService.getById(requestDTO.getManagerId());
            if (manager == null) {
                throw new IllegalArgumentException("Manager not found with id: " + requestDTO.getManagerId());
            }
            // Validate manager is in same department
            if (manager.getDepartment() == null || !manager.getDepartment().getId().equals(department.getId())) {
                throw new IllegalArgumentException("Manager must be in the same department as the employee");
            }
        }
        
        Employee updatedEmployee = EmployeeMapper.toEntity(requestDTO, department, location, manager);
        updatedEmployee.setId(id); // Ensure ID is preserved for update
        Employee savedEmployee = employeeService.save(updatedEmployee);
        logger.info("Employee updated successfully with id: {}", id);
        return ResponseEntity.ok(EmployeeMapper.toResponseDTO(savedEmployee));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "','" + RoleConstants.HR_MANAGER + "')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        logger.info("Deleting employee with id: {}", id);
        Employee employee = employeeService.getById(id);
        if (employee == null) {
            logger.warn("Employee not found with id: {}", id);
            return ResponseEntity.notFound().build();
        }
        employeeService.delete(id);
        logger.info("Employee deleted successfully with id: {}", id);
        return ResponseEntity.noContent().build();
    }
}