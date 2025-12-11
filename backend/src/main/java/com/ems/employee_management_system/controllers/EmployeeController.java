package com.ems.employee_management_system.controllers;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ems.employee_management_system.dtos.EmployeeRequestDTO;
import com.ems.employee_management_system.dtos.EmployeeResponseDTO;
import com.ems.employee_management_system.dtos.PaginatedResponseDTO;
import com.ems.employee_management_system.mappers.EmployeeMapper;
import com.ems.employee_management_system.models.Department;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.Location;
import com.ems.employee_management_system.services.DepartmentService;
import com.ems.employee_management_system.services.EmployeeService;
import com.ems.employee_management_system.services.LocationService;
import com.ems.employee_management_system.utils.PaginationUtils;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(EmployeeController.class);
    
    private final EmployeeService employeeService;
    private final DepartmentService departmentService;
    private final LocationService locationService;

    public EmployeeController(EmployeeService employeeService, DepartmentService departmentService, LocationService locationService) {
        this.employeeService = employeeService;
        this.departmentService = departmentService;
        this.locationService = locationService;
    }

    @GetMapping
    public ResponseEntity<PaginatedResponseDTO<EmployeeResponseDTO>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "ASC") String sortDir) {
        logger.debug("Fetching employees with pagination: page={}, size={}, sortBy={}, sortDir={}", page, size, sortBy, sortDir);
        
        Pageable pageable = PaginationUtils.createPageable(page, size, sortBy, sortDir);
        Page<Employee> employeePage = employeeService.getAll(pageable);
        
        return ResponseEntity.ok(PaginationUtils.toPaginatedResponse(employeePage, EmployeeMapper::toResponseDTO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponseDTO> getById(@PathVariable UUID id) {
        logger.debug("Fetching employee with id: {}", id);
        Employee employee = employeeService.getById(id);
        if (employee == null) {
            logger.warn("Employee not found with id: {}", id);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(EmployeeMapper.toResponseDTO(employee));
    }

    @PostMapping
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
        }
        
        Employee employee = EmployeeMapper.toEntity(requestDTO, department, location, manager);
        Employee savedEmployee = employeeService.save(employee);
        logger.info("Employee created successfully with id: {}", savedEmployee.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(EmployeeMapper.toResponseDTO(savedEmployee));
    }

    @PutMapping("/{id}")
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
        }
        
        Employee updatedEmployee = EmployeeMapper.toEntity(requestDTO, department, location, manager);
        updatedEmployee.setId(id); // Ensure ID is preserved for update
        Employee savedEmployee = employeeService.save(updatedEmployee);
        logger.info("Employee updated successfully with id: {}", id);
        return ResponseEntity.ok(EmployeeMapper.toResponseDTO(savedEmployee));
    }

    @DeleteMapping("/{id}")
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