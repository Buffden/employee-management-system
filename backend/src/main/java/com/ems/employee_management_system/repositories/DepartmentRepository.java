package com.ems.employee_management_system.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ems.employee_management_system.models.Department;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    Optional<Department> findByName(String name);
    
    /**
     * Find department by ID with relationships eagerly loaded
     * Used when we need location and departmentHead to be available for mapping
     */
    @Query("SELECT d FROM Department d LEFT JOIN FETCH d.location LEFT JOIN FETCH d.departmentHead WHERE d.id = :id")
    Optional<Department> findByIdWithRelationships(@Param("id") UUID id);
    
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.department.id = :departmentId")
    Long countEmployeesByDepartment(@Param("departmentId") UUID departmentId);

    /**
     * Find departments where a specific employee is the department manager
     * Used to validate that an employee is not already manager of another department
     */
    @Query("SELECT d FROM Department d WHERE d.departmentHead.id = :employeeId")
    List<Department> findDepartmentsByHeadId(@Param("employeeId") UUID employeeId);

    // Simplified query: return all departments for authorized roles
    // Role-based filtering is handled at the controller level via @PreAuthorize
    // This matches the location repository pattern for consistency
    // Note: Cannot use JOIN FETCH with Pageable and parameters, so relationships are loaded separately if needed
    @Query("SELECT d FROM Department d")
    Page<Department> findAllFilteredByRole(@Param("role") String role,
                                           @Param("departmentId") UUID departmentId,
                                           Pageable pageable);
    
    /**
     * Find all departments with relationships eagerly loaded
     * Used when we need location and departmentHead to be available for mapping
     */
    @Query("SELECT DISTINCT d FROM Department d LEFT JOIN FETCH d.location LEFT JOIN FETCH d.departmentHead")
    List<Department> findAllWithRelationships();
    
    /**
     * Find all departments with pagination and relationships eagerly loaded
     * Note: COUNT query is handled separately for pagination to work correctly with DISTINCT and JOIN FETCH
     */
    @Query(value = "SELECT DISTINCT d FROM Department d LEFT JOIN FETCH d.location LEFT JOIN FETCH d.departmentHead",
           countQuery = "SELECT COUNT(DISTINCT d) FROM Department d")
    Page<Department> findAllWithRelationships(Pageable pageable);
    /**
     * Search departments by name for typeahead/autocomplete
     * Searches in name field
     * Optionally filters by location if provided
     * Excludes a specific department if provided
     */
    @Query("""
        SELECT d FROM Department d
        WHERE (:searchTerm IS NULL OR :searchTerm = '' OR
               LOWER(d.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')))
        AND (:locationId IS NULL OR d.location.id = :locationId)
        AND (:excludeDepartmentId IS NULL OR d.id != :excludeDepartmentId)
        ORDER BY d.name ASC
        """)
    List<Department> searchDepartments(@Param("searchTerm") String searchTerm,
                                   @Param("locationId") UUID locationId,
                                   @Param("excludeDepartmentId") UUID excludeDepartmentId);
}
