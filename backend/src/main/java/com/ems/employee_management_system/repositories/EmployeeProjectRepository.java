package com.ems.employee_management_system.repositories;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ems.employee_management_system.models.EmployeeProject;
import com.ems.employee_management_system.models.EmployeeProject.EmployeeProjectId;
import com.ems.employee_management_system.enums.UserRole;

public interface EmployeeProjectRepository extends JpaRepository<EmployeeProject, EmployeeProjectId> {
    
    @Query("""
        SELECT ep FROM EmployeeProject ep
        WHERE (:role = '" + UserRole.SYSTEM_ADMIN.getValue() + "' OR :role = '" + UserRole.HR_MANAGER.getValue() + "')
           OR (:role = '" + UserRole.DEPARTMENT_MANAGER.getValue() + "' AND ep.project.department.id = :departmentId)
           OR (:role = '" + UserRole.EMPLOYEE.getValue() + "' AND ep.employee.id = :userId)
        """)
    Page<EmployeeProject> findAllFilteredByRole(@Param("role") String role,
                                                @Param("departmentId") UUID departmentId,
                                                @Param("userId") UUID userId,
                                                Pageable pageable);

    /**
     * Count active project assignments for an employee (for delete validation)
     * Note: Currently, EmployeeProject doesn't have a status field, so we count all assignments
     * Future enhancement: Add status field and filter by ACTIVE status
     */
    @Query("SELECT COUNT(ep) FROM EmployeeProject ep WHERE ep.employee.id = :employeeId")
    Long countByEmployeeId(@Param("employeeId") UUID employeeId);

    /**
     * Count employee assignments for a project
     * Used for logging when deleting projects (to show how many assignments were deleted)
     */
    @Query("SELECT COUNT(ep) FROM EmployeeProject ep WHERE ep.project.id = :projectId")
    Long countByProjectId(@Param("projectId") UUID projectId);

    /**
     * Delete all employee-project assignments for a project (for cascade delete)
     * Used when deleting a project to automatically remove all employee assignments
     */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM EmployeeProject ep WHERE ep.project.id = :projectId")
    void deleteByProjectId(@Param("projectId") UUID projectId);
}