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
}