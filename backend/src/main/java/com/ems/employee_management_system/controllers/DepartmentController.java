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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.ems.employee_management_system.dtos.DepartmentRequestDTO;
import com.ems.employee_management_system.dtos.DepartmentResponseDTO;
import com.ems.employee_management_system.dtos.DepartmentQueryRequestDTO;
import com.ems.employee_management_system.dtos.FilterOptionDTO;
import com.ems.employee_management_system.dtos.PaginatedResponseDTO;
import com.ems.employee_management_system.mappers.DepartmentMapper;
import com.ems.employee_management_system.models.Department;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.Location;
import com.ems.employee_management_system.security.SecurityService;
import com.ems.employee_management_system.services.DepartmentService;
import com.ems.employee_management_system.services.EmployeeService;
import com.ems.employee_management_system.services.LocationService;
import com.ems.employee_management_system.utils.PaginationUtils;
import com.ems.employee_management_system.constants.RoleConstants;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/departments")
@PreAuthorize("hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "', '" + RoleConstants.HR_MANAGER + "', '" + RoleConstants.DEPARTMENT_MANAGER + "', '" + RoleConstants.EMPLOYEE + "')")
public class DepartmentController {
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(DepartmentController.class);
    
    private final DepartmentService departmentService;
    private final LocationService locationService;
    private final EmployeeService employeeService;
    private final SecurityService securityService;

    public DepartmentController(DepartmentService departmentService, LocationService locationService, 
                                EmployeeService employeeService, SecurityService securityService) {
        this.departmentService = departmentService;
        this.locationService = locationService;
        this.employeeService = employeeService;
        this.securityService = securityService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "', '" + RoleConstants.HR_MANAGER + "', '" + RoleConstants.DEPARTMENT_MANAGER + "', '" + RoleConstants.EMPLOYEE + "')")
    public ResponseEntity<PaginatedResponseDTO<DepartmentResponseDTO>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "ASC") String sortDir) {
        logger.debug("Fetching departments with pagination: page={}, size={}, sortBy={}, sortDir={}", page, size, sortBy, sortDir);
        
        Pageable pageable = PaginationUtils.createPageable(page, size, sortBy, sortDir);
        Page<Department> departmentPage = departmentService.getAll(pageable);
        
        return ResponseEntity.ok(PaginationUtils.toPaginatedResponse(departmentPage, DepartmentMapper::toResponseDTO));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "', '" + RoleConstants.HR_MANAGER + "', '" + RoleConstants.DEPARTMENT_MANAGER + "', '" + RoleConstants.EMPLOYEE + "') and " +
                  "(@securityService.hasRole('" + RoleConstants.SYSTEM_ADMIN + "') or @securityService.hasRole('" + RoleConstants.HR_MANAGER + "') or " +
                  "@securityService.hasRole('" + RoleConstants.DEPARTMENT_MANAGER + "') or @securityService.isOwnDepartment(#id) or " +
                  "@securityService.getCurrentUserEmployeeId() != null)")
    public ResponseEntity<DepartmentResponseDTO> getById(@PathVariable UUID id) {
        logger.debug("Fetching department with id: {}", id);
        Department department = departmentService.getById(id);
        if (department == null) {
            logger.warn("Department not found with id: {}", id);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(DepartmentMapper.toResponseDTO(department));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "', '" + RoleConstants.HR_MANAGER + "', '" + RoleConstants.DEPARTMENT_MANAGER + "')")
    public ResponseEntity<PaginatedResponseDTO<DepartmentResponseDTO>> query(@RequestBody DepartmentQueryRequestDTO queryRequest) {
        logger.debug("Querying departments with pagination: page={}, size={}, sortBy={}, sortDir={}", 
                queryRequest.getPage(), queryRequest.getSize(), queryRequest.getSortBy(), queryRequest.getSortDir());
        
        Pageable pageable = PaginationUtils.createPageable(
                queryRequest.getPage(), 
                queryRequest.getSize(), 
                queryRequest.getSortBy(), 
                queryRequest.getSortDir());
        Page<Department> departmentPage = departmentService.getAll(pageable);
        
        // Build filters array with locations for reusable table filtering
        // IMPORTANT: Filters should ALWAYS contain ALL possible values, independent of pagination
        // Filters only narrow down when other filters are applied (future filtering implementation)
        // This ensures filter dropdowns always show complete options regardless of current page
        Map<String, List<FilterOptionDTO>> filters = new HashMap<>();
        List<Location> allLocations = locationService.getAll(); // Fetches ALL locations, not paginated
        List<FilterOptionDTO> locationFilters = allLocations.stream()
                .map(location -> new FilterOptionDTO(
                        location.getId().toString(),
                        location.getName(),
                        location.getCity() + ", " + location.getState() // Additional display info
                ))
                .collect(Collectors.toList());
        filters.put("locations", locationFilters);
        
        return ResponseEntity.ok(PaginationUtils.toPaginatedResponse(departmentPage, DepartmentMapper::toResponseDTO, filters));
    }

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "', '" + RoleConstants.HR_MANAGER + "')")
    public ResponseEntity<DepartmentResponseDTO> create(@Valid @RequestBody DepartmentRequestDTO requestDTO) {
        logger.info("Creating new department: {}", requestDTO.getName());
        
        // Validate location exists (required field)
        Location location = locationService.getById(requestDTO.getLocationId());
        if (location == null) {
            logger.warn("Location not found with id: {}", requestDTO.getLocationId());
            throw new IllegalArgumentException("Location not found with id: " + requestDTO.getLocationId());
        }
        
        // Department head is optional - skip validation for now since employees aren't implemented yet
        // Will be validated in Phase 3 when employee management is implemented
        Employee head = null;
        
        Department department = DepartmentMapper.toEntity(requestDTO, location, head);
        Department savedDepartment = departmentService.save(department);
        logger.info("Department created successfully with id: {}", savedDepartment.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(DepartmentMapper.toResponseDTO(savedDepartment));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "', '" + RoleConstants.HR_MANAGER + "') or " +
                  "(hasRole('" + RoleConstants.DEPARTMENT_MANAGER + "') and @securityService.isOwnDepartment(#id))")
    public ResponseEntity<DepartmentResponseDTO> update(@PathVariable UUID id, @Valid @RequestBody DepartmentRequestDTO requestDTO) {
        logger.info("Updating department with id: {}", id);
        Department existingDepartment = departmentService.getById(id);
        if (existingDepartment == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Validate location exists (required field)
        Location location = locationService.getById(requestDTO.getLocationId());
        if (location == null) {
            throw new IllegalArgumentException("Location not found with id: " + requestDTO.getLocationId());
        }
        
        // Department head is optional - skip validation for now since employees aren't implemented yet
        // Will be validated in Phase 3 when employee management is implemented
        Employee head = null;
        
        Department updatedDepartment = DepartmentMapper.toEntity(requestDTO, location, head);
        updatedDepartment.setId(id); // Ensure ID is preserved for update
        updatedDepartment.setCreatedAt(existingDepartment.getCreatedAt()); // Preserve createdAt
        Department savedDepartment = departmentService.save(updatedDepartment);
        logger.info("Department updated successfully with id: {}", id);
        return ResponseEntity.ok(DepartmentMapper.toResponseDTO(savedDepartment));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "', '" + RoleConstants.HR_MANAGER + "')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        logger.info("Deleting department with id: {}", id);
        Department department = departmentService.getById(id);
        if (department == null) {
            logger.warn("Department not found with id: {}", id);
            return ResponseEntity.notFound().build();
        }
        departmentService.delete(id);
        logger.info("Department deleted successfully with id: {}", id);
        return ResponseEntity.noContent().build();
    }
}
