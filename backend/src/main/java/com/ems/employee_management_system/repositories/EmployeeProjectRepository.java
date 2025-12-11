package com.ems.employee_management_system.repositories;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ems.employee_management_system.models.EmployeeProject;
import com.ems.employee_management_system.models.EmployeeProject.EmployeeProjectId;

public interface EmployeeProjectRepository extends JpaRepository<EmployeeProject, EmployeeProjectId> {
    
    @Query("""
        SELECT ep FROM EmployeeProject ep
        WHERE (:role = 'SYSTEM_ADMIN' OR :role = 'HR_MANAGER')
           OR (:role = 'DEPARTMENT_MANAGER' AND ep.project.department.id = :departmentId)
           OR (:role = 'EMPLOYEE' AND ep.employee.id = :userId)
        """)
    Page<EmployeeProject> findAllFilteredByRole(@Param("role") String role,
                                                @Param("departmentId") UUID departmentId,
                                                @Param("userId") UUID userId,
                                                Pageable pageable);
}