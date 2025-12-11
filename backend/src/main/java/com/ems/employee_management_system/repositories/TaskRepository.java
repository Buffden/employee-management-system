package com.ems.employee_management_system.repositories;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ems.employee_management_system.models.Task;
import com.ems.employee_management_system.enums.UserRole;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    
    @Query("""
        SELECT t FROM Task t
        WHERE (:role = '" + UserRole.SYSTEM_ADMIN.getValue() + "' OR :role = '" + UserRole.HR_MANAGER.getValue() + "')
           OR (:role = '" + UserRole.DEPARTMENT_MANAGER.getValue() + "' AND t.project.department.id = :departmentId)
           OR (:role = '" + UserRole.EMPLOYEE.getValue() + "' AND t.assignedTo.id = :userId)
        """)
    Page<Task> findAllFilteredByRole(@Param("role") String role,
                                     @Param("departmentId") UUID departmentId,
                                     @Param("userId") UUID userId,
                                     Pageable pageable);
}