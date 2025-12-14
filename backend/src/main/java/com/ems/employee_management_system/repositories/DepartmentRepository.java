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
    
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.department.id = :departmentId")
    Long countEmployeesByDepartment(@Param("departmentId") UUID departmentId);

    /**
     * Find departments where a specific employee is the department head
     * Used to validate that an employee is not already head of another department
     */
    @Query("SELECT d FROM Department d WHERE d.departmentHead.id = :employeeId")
    List<Department> findDepartmentsByHeadId(@Param("employeeId") UUID employeeId);

    // Simplified query: return all departments for authorized roles
    // Role-based filtering is handled at the controller level via @PreAuthorize
    // This matches the location repository pattern for consistency
    @Query("SELECT d FROM Department d")
    Page<Department> findAllFilteredByRole(@Param("role") String role,
                                           @Param("departmentId") UUID departmentId,
                                           Pageable pageable);
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
