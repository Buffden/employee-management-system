package com.ems.employee_management_system.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ems.employee_management_system.models.Employee;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    Optional<Employee> findByEmail(String email);
    
    /**
     * Find employee by ID with relationships eagerly loaded
     * Used when we need department, location, and manager to be available for mapping
     */
    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.department LEFT JOIN FETCH e.location LEFT JOIN FETCH e.manager WHERE e.id = :id")
    Optional<Employee> findByIdWithRelationships(@Param("id") UUID id);

    @Query("""
        SELECT e FROM Employee e
        WHERE (:role = 'SYSTEM_ADMIN' OR :role = 'HR_MANAGER')
           OR (:role = 'DEPARTMENT_MANAGER' AND :departmentId IS NOT NULL AND e.department IS NOT NULL AND e.department.id = :departmentId)
           OR (:role = 'EMPLOYEE' AND :userId IS NOT NULL AND e.id = :userId)
        """)
    Page<Employee> findAllFilteredByRole(@Param("role") String role,
                                         @Param("departmentId") UUID departmentId,
                                         @Param("userId") UUID userId,
                                         Pageable pageable);
    
    /**
     * Find all employees with relationships eagerly loaded
     * Used when we need department, location, and manager to be available for mapping
     */
    @Query(value = "SELECT DISTINCT e FROM Employee e LEFT JOIN FETCH e.department LEFT JOIN FETCH e.location LEFT JOIN FETCH e.manager",
           countQuery = "SELECT COUNT(DISTINCT e) FROM Employee e")
    Page<Employee> findAllWithRelationships(Pageable pageable);

    /**
     * Find all employees by department ID (for manager dropdown filtering)
     */
    @Query("SELECT e FROM Employee e WHERE e.department.id = :departmentId")
    List<Employee> findByDepartmentId(@Param("departmentId") UUID departmentId);

    /**
     * Count employees in a department (for delete validation)
     */
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.department.id = :departmentId")
    Long countByDepartmentId(@Param("departmentId") UUID departmentId);

    /**
     * Count direct reports for a manager (for delete validation)
     */
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.manager.id = :managerId")
    Long countDirectReports(@Param("managerId") UUID managerId);

    /**
     * Search employees by name or email for typeahead/autocomplete
     * Searches in firstName, lastName, and email fields
     * Optionally filters by department if provided
     * Limits results to 20 for performance
     */
    @Query("""
        SELECT e FROM Employee e
        WHERE (:searchTerm IS NULL OR :searchTerm = '' OR
               LOWER(e.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
               LOWER(e.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
               LOWER(CONCAT(e.firstName, ' ', e.lastName)) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
               LOWER(e.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')))
        AND (:departmentId IS NULL OR e.department.id = :departmentId)
        AND (:excludeEmployeeId IS NULL OR e.id != :excludeEmployeeId)
        ORDER BY e.firstName ASC, e.lastName ASC
        """)
    List<Employee> searchEmployees(@Param("searchTerm") String searchTerm,
                                    @Param("departmentId") UUID departmentId,
                                    @Param("excludeEmployeeId") UUID excludeEmployeeId);
}
