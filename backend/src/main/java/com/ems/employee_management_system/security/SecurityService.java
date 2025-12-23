package com.ems.employee_management_system.security;

import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.ems.employee_management_system.models.Employee;
import com.ems.employee_management_system.models.EmployeeProject.EmployeeProjectId;
import com.ems.employee_management_system.models.User;
import com.ems.employee_management_system.repositories.DepartmentRepository;
import com.ems.employee_management_system.repositories.EmployeeProjectRepository;
import com.ems.employee_management_system.repositories.EmployeeRepository;
import com.ems.employee_management_system.repositories.ProjectRepository;
import com.ems.employee_management_system.repositories.TaskRepository;
import com.ems.employee_management_system.repositories.UserRepository;

@Service
public class SecurityService {
    
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final EmployeeProjectRepository employeeProjectRepository;
    private final DepartmentRepository departmentRepository;
    
    public SecurityService(UserRepository userRepository, 
                          EmployeeRepository employeeRepository,
                          ProjectRepository projectRepository,
                          TaskRepository taskRepository,
                          EmployeeProjectRepository employeeProjectRepository,
                          DepartmentRepository departmentRepository) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.employeeProjectRepository = employeeProjectRepository;
        this.departmentRepository = departmentRepository;
    }
    
    /**
     * Get currently authenticated user
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        
        String username = authentication.getName();
        return userRepository.findByUsername(username).orElse(null);
    }
    
    /**
     * Get current user ID
     */
    public UUID getCurrentUserId() {
        User user = getCurrentUser();
        return user != null ? user.getId() : null;
    }
    
    /**
     * Get current user role
     */
    public String getCurrentUserRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        
        return authentication.getAuthorities().stream()
                .findFirst()
                .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                .orElse(null);
    }
    
    /**
     * Get current user's department ID (for Department Manager or Employee)
     */
    public UUID getCurrentUserDepartmentId() {
        User user = getCurrentUser();
        if (user == null || user.getEmployee() == null) {
            return null;
        }
        
        Employee employee = user.getEmployee();
        return employee.getDepartment() != null ? employee.getDepartment().getId() : null;
    }
    
    /**
     * Get current user's employee ID (if linked)
     */
    public UUID getCurrentUserEmployeeId() {
        User user = getCurrentUser();
        return user != null && user.getEmployee() != null ? user.getEmployee().getId() : null;
    }
    
    /**
     * Check if user has specific role
     */
    public boolean hasRole(String role) {
        String currentRole = getCurrentUserRole();
        return currentRole != null && currentRole.equals(role);
    }
    
    /**
     * Check if employee is in current user's department
     */
    public boolean isInOwnDepartment(UUID employeeId) {
        UUID userDepartmentId = getCurrentUserDepartmentId();
        if (userDepartmentId == null) {
            return false;
        }
        
        return employeeRepository.findById(employeeId)
                .map(employee -> employee.getDepartment() != null && 
                     employee.getDepartment().getId().equals(userDepartmentId))
                .orElse(false);
    }
    
    /**
     * Check if department is current user's department
     * For department managers, also checks if user is the department manager (head) of the department
     */
    public boolean isOwnDepartment(UUID departmentId) {
        UUID userEmployeeId = getCurrentUserEmployeeId();
        if (userEmployeeId == null) {
            return false;
        }
        
        // Check if user is the department manager (head) of this department
        return departmentRepository.findByIdWithRelationships(departmentId)
                .map(department -> department.getHead() != null && 
                     department.getHead().getId().equals(userEmployeeId))
                .orElse(false);
    }
    
    /**
     * Check if employee record belongs to current user
     */
    public boolean isOwnRecord(UUID employeeId) {
        UUID userEmployeeId = getCurrentUserEmployeeId();
        return userEmployeeId != null && userEmployeeId.equals(employeeId);
    }
    
    /**
     * Check if project's department is user's department
     */
    public boolean isProjectInOwnDepartment(UUID departmentId) {
        return isOwnDepartment(departmentId);
    }
    
    /**
     * Check if project (by ID) is in user's department
     * For department managers, checks if user is the department manager (head) of the project's department
     */
    public boolean isProjectInOwnDepartmentByProjectId(UUID projectId) {
        UUID userEmployeeId = getCurrentUserEmployeeId();
        if (userEmployeeId == null) {
            return false;
        }
        
        // Get the project and check if user is department manager of the project's department
        return projectRepository.findById(projectId)
                .map(project -> {
                    if (project.getDepartment() == null) {
                        return false;
                    }
                    UUID departmentId = project.getDepartment().getId();
                    // Check if user is the department manager (head) of this department
                    return departmentRepository.findByIdWithRelationships(departmentId)
                            .map(department -> department.getHead() != null && 
                                 department.getHead().getId().equals(userEmployeeId))
                            .orElse(false);
                })
                .orElse(false);
    }
    
    /**
     * Check if task's project is in user's department
     */
    public boolean isTaskProjectInOwnDepartment(UUID projectId) {
        return isProjectInOwnDepartmentByProjectId(projectId);
    }
    
    /**
     * Check if task (by ID) belongs to project in user's department
     */
    public boolean isTaskProjectInOwnDepartmentByTaskId(UUID taskId) {
        UUID userDepartmentId = getCurrentUserDepartmentId();
        if (userDepartmentId == null) {
            return false;
        }
        
        return taskRepository.findById(taskId)
                .map(task -> task.getProject() != null && 
                     task.getProject().getDepartment() != null &&
                     task.getProject().getDepartment().getId().equals(userDepartmentId))
                .orElse(false);
    }
    
    /**
     * Check if task is assigned to current user
     */
    public boolean isTaskAssignedToUser(UUID taskId) {
        UUID userEmployeeId = getCurrentUserEmployeeId();
        if (userEmployeeId == null) {
            return false;
        }
        
        return taskRepository.findById(taskId)
                .map(task -> task.getAssignedTo() != null && 
                     task.getAssignedTo().getId().equals(userEmployeeId))
                .orElse(false);
    }
    
    /**
     * Check if current user (employee) is assigned to a project
     */
    public boolean isProjectAssignedToUser(UUID projectId) {
        UUID userEmployeeId = getCurrentUserEmployeeId();
        if (userEmployeeId == null) {
            return false;
        }
        
        EmployeeProjectId id = new EmployeeProjectId(userEmployeeId, projectId);
        return employeeProjectRepository.findById(id).isPresent();
    }
    
    /**
     * Check if current user is the project manager of a specific project
     */
    public boolean isProjectManagerOfProject(UUID projectId) {
        UUID userEmployeeId = getCurrentUserEmployeeId();
        if (userEmployeeId == null) {
            return false;
        }
        
        return projectRepository.findById(projectId)
                .map(project -> project.getProjectManager() != null && 
                     project.getProjectManager().getId().equals(userEmployeeId))
                .orElse(false);
    }
    
    /**
     * Check if current user is the project manager of a task's project
     */
    public boolean isProjectManagerOfTaskProject(UUID taskId) {
        UUID userEmployeeId = getCurrentUserEmployeeId();
        if (userEmployeeId == null) {
            return false;
        }
        
        return taskRepository.findById(taskId)
                .map(task -> task.getProject() != null && 
                     task.getProject().getProjectManager() != null &&
                     task.getProject().getProjectManager().getId().equals(userEmployeeId))
                .orElse(false);
    }
}

