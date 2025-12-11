package com.ems.employee_management_system.repositories;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ems.employee_management_system.models.Task;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    
    @Query("""
        SELECT t FROM Task t
        WHERE (:role = 'SYSTEM_ADMIN' OR :role = 'HR_MANAGER')
           OR (:role = 'DEPARTMENT_MANAGER' AND t.project.department.id = :departmentId)
           OR (:role = 'EMPLOYEE' AND t.assignedTo.id = :userId)
        """)
    Page<Task> findAllFilteredByRole(@Param("role") String role,
                                     @Param("departmentId") UUID departmentId,
                                     @Param("userId") UUID userId,
                                     Pageable pageable);
}