package com.ems.employee_management_system.repositories;

import java.util.List;
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

    /**
     * Count tasks for a project
     * Used for logging when deleting projects (to show how many tasks were deleted)
     */
    @Query("SELECT COUNT(t) FROM Task t WHERE t.project.id = :projectId")
    Long countByProjectId(@Param("projectId") UUID projectId);

    /**
     * Delete all tasks for a project (for cascade delete)
     * Used when deleting a project to automatically delete all associated tasks
     */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM Task t WHERE t.project.id = :projectId")
    void deleteByProjectId(@Param("projectId") UUID projectId);

    /**
     * Find all tasks for a project
     * Used when fetching project details to include associated tasks
     */
    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId ORDER BY t.startDate DESC, t.name ASC")
    List<Task> findByProjectId(@Param("projectId") UUID projectId);
}