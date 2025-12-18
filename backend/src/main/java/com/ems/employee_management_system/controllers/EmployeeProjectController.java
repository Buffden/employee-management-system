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

import com.ems.employee_management_system.dtos.EmployeeProjectRequestDTO;
import com.ems.employee_management_system.dtos.EmployeeProjectResponseDTO;
import com.ems.employee_management_system.dtos.PaginatedResponseDTO;
import com.ems.employee_management_system.mappers.EmployeeProjectMapper;
import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.EmployeeProject;
import com.ems.employee_management_system.models.EmployeeProject.EmployeeProjectId;
import com.ems.employee_management_system.models.Project;
import com.ems.employee_management_system.security.SecurityService;
import com.ems.employee_management_system.services.EmployeeProjectService;
import com.ems.employee_management_system.services.EmployeeService;
import com.ems.employee_management_system.services.ProjectService;
import com.ems.employee_management_system.utils.PaginationUtils;
import com.ems.employee_management_system.constants.RoleConstants;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/employee-projects")
@PreAuthorize("hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "', '" + RoleConstants.HR_MANAGER + "', '" + RoleConstants.DEPARTMENT_MANAGER + "', '" + RoleConstants.EMPLOYEE + "')")
public class EmployeeProjectController {
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(EmployeeProjectController.class);
    
    private final EmployeeProjectService employeeProjectService;
    private final EmployeeService employeeService;
    private final ProjectService projectService;
    private final SecurityService securityService;

    public EmployeeProjectController(EmployeeProjectService employeeProjectService, EmployeeService employeeService, 
                                    ProjectService projectService, SecurityService securityService) {
        this.employeeProjectService = employeeProjectService;
        this.employeeService = employeeService;
        this.projectService = projectService;
        this.securityService = securityService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "', '" + RoleConstants.HR_MANAGER + "', '" + RoleConstants.DEPARTMENT_MANAGER + "', '" + RoleConstants.EMPLOYEE + "')")
    public ResponseEntity<PaginatedResponseDTO<EmployeeProjectResponseDTO>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "ASC") String sortDir) {
        logger.debug("Fetching employee-project assignments with pagination: page={}, size={}, sortBy={}, sortDir={}", page, size, sortBy, sortDir);
        
        Pageable pageable = PaginationUtils.createPageable(page, size, sortBy, sortDir);
        Page<EmployeeProject> employeeProjectPage = employeeProjectService.getAll(pageable);
        
        return ResponseEntity.ok(PaginationUtils.toPaginatedResponse(employeeProjectPage, EmployeeProjectMapper::toResponseDTO));
    }

    @GetMapping("/{employeeId}/{projectId}")
    @PreAuthorize("hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "', '" + RoleConstants.HR_MANAGER + "', '" + RoleConstants.DEPARTMENT_MANAGER + "', '" + RoleConstants.EMPLOYEE + "') and " +
                  "(hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "', '" + RoleConstants.HR_MANAGER + "', '" + RoleConstants.DEPARTMENT_MANAGER + "') or " +
                  "@securityService.isOwnRecord(T(java.util.UUID).fromString(#employeeId)))")
    public ResponseEntity<EmployeeProjectResponseDTO> getById(@PathVariable("employeeId") String employeeId, @PathVariable("projectId") String projectId) {
        logger.debug("Fetching employee-project assignment: employeeId={}, projectId={}", employeeId, projectId);
        EmployeeProjectId id = new EmployeeProjectId(UUID.fromString(employeeId), UUID.fromString(projectId));
        EmployeeProject ep = employeeProjectService.getById(id);
        if (ep == null) {
            logger.debug("Employee-project assignment not found: employeeId={}, projectId={}", employeeId, projectId);
            // Return 200 OK with null body instead of 404, as "not found" is a valid state for existence checks
            return ResponseEntity.ok().body(null);
        }
        return ResponseEntity.ok(EmployeeProjectMapper.toResponseDTO(ep));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "', '" + RoleConstants.HR_MANAGER + "') or " +
                  "(hasRole('" + RoleConstants.DEPARTMENT_MANAGER + "') and @securityService.isProjectInOwnDepartmentByProjectId(#requestDTO.projectId))")
    public ResponseEntity<EmployeeProjectResponseDTO> create(@Valid @RequestBody EmployeeProjectRequestDTO requestDTO) {
        logger.info("Creating new employee-project assignment: employeeId={}, projectId={}", requestDTO.getEmployeeId(), requestDTO.getProjectId());
        // Validate related entities exist
        Employee employee = employeeService.getById(requestDTO.getEmployeeId());
        if (employee == null) {
            throw new IllegalArgumentException("Employee not found with id: " + requestDTO.getEmployeeId());
        }
        
        Project project = projectService.getById(requestDTO.getProjectId());
        if (project == null) {
            throw new IllegalArgumentException("Project not found with id: " + requestDTO.getProjectId());
        }
        
        EmployeeProject ep = EmployeeProjectMapper.toEntity(requestDTO, employee, project);
        EmployeeProject savedEp = employeeProjectService.save(ep);
        logger.info("Employee-project assignment created successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(EmployeeProjectMapper.toResponseDTO(savedEp));
    }

    @PutMapping("/{employeeId}/{projectId}")
    @PreAuthorize("hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "', '" + RoleConstants.HR_MANAGER + "') or " +
                  "(hasRole('" + RoleConstants.DEPARTMENT_MANAGER + "') and @securityService.isProjectInOwnDepartmentByProjectId(T(java.util.UUID).fromString(#projectId)))")
    public ResponseEntity<EmployeeProjectResponseDTO> update(@PathVariable("employeeId") String employeeId, @PathVariable("projectId") String projectId, @Valid @RequestBody EmployeeProjectRequestDTO requestDTO) {
        logger.info("Updating employee-project assignment: employeeId={}, projectId={}", employeeId, projectId);
        EmployeeProjectId id = new EmployeeProjectId(UUID.fromString(employeeId), UUID.fromString(projectId));
        EmployeeProject existingEp = employeeProjectService.getById(id);
        if (existingEp == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Validate related entities exist
        Employee employee = employeeService.getById(requestDTO.getEmployeeId());
        if (employee == null) {
            throw new IllegalArgumentException("Employee not found with id: " + requestDTO.getEmployeeId());
        }
        
        Project project = projectService.getById(requestDTO.getProjectId());
        if (project == null) {
            throw new IllegalArgumentException("Project not found with id: " + requestDTO.getProjectId());
        }
        
        EmployeeProject updatedEp = EmployeeProjectMapper.toEntity(requestDTO, employee, project);
        // Composite key is preserved through employee and project references
        EmployeeProject savedEp = employeeProjectService.save(updatedEp);
        logger.info("Employee-project assignment updated successfully");
        return ResponseEntity.ok(EmployeeProjectMapper.toResponseDTO(savedEp));
    }

    @DeleteMapping("/{employeeId}/{projectId}")
    @PreAuthorize("hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "', '" + RoleConstants.HR_MANAGER + "') or " +
                  "(hasRole('" + RoleConstants.DEPARTMENT_MANAGER + "') and @securityService.isProjectInOwnDepartmentByProjectId(T(java.util.UUID).fromString(#projectId)))")
    public ResponseEntity<Void> delete(@PathVariable("employeeId") String employeeId, @PathVariable("projectId") String projectId) {
        logger.info("Deleting employee-project assignment: employeeId={}, projectId={}", employeeId, projectId);
        EmployeeProjectId id = new EmployeeProjectId(UUID.fromString(employeeId), UUID.fromString(projectId));
        EmployeeProject ep = employeeProjectService.getById(id);
        if (ep == null) {
            logger.warn("Employee-project assignment not found: employeeId={}, projectId={}", employeeId, projectId);
            return ResponseEntity.notFound().build();
        }
        employeeProjectService.delete(id);
        logger.info("Employee-project assignment deleted successfully");
        return ResponseEntity.noContent().build();
    }
} 