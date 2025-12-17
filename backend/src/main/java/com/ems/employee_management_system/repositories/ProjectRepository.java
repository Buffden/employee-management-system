package com.ems.employee_management_system.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ems.employee_management_system.models.Project;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    Optional<Project> findByName(String name);
    
    /**
     * Find project by ID with relationships eagerly loaded
     * Used when we need department and projectManager to be available for mapping
     */
    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.department LEFT JOIN FETCH p.projectManager WHERE p.id = :id")
    Optional<Project> findByIdWithRelationships(@Param("id") UUID id);

    @Query("""
        SELECT DISTINCT p FROM Project p
        LEFT JOIN FETCH p.department
        LEFT JOIN FETCH p.projectManager
        WHERE (:role = 'SYSTEM_ADMIN' OR :role = 'HR_MANAGER')
           OR (:role = 'DEPARTMENT_MANAGER' AND :departmentId IS NOT NULL AND p.department IS NOT NULL AND p.department.id = :departmentId)
           OR (:role = 'EMPLOYEE' AND :userId IS NOT NULL AND EXISTS (
               SELECT ep FROM EmployeeProject ep WHERE ep.project.id = p.id AND ep.employee.id = :userId
           ))
        """)
    Page<Project> findAllFilteredByRole(@Param("role") String role,
                                        @Param("departmentId") UUID departmentId,
                                        @Param("userId") UUID userId,
                                        Pageable pageable);
    
    /**
     * Find all projects with relationships eagerly loaded
     * Used when we need department and projectManager to be available for mapping
     */
    @Query(value = "SELECT DISTINCT p FROM Project p LEFT JOIN FETCH p.department LEFT JOIN FETCH p.projectManager",
           countQuery = "SELECT COUNT(DISTINCT p) FROM Project p")
    Page<Project> findAllWithRelationships(Pageable pageable);
}